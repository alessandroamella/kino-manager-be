import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class R2Service implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.s3Client = new S3Client({
      endpoint: this.config.get<string>('R2_ENDPOINT'),
      region: 'auto',
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.config.get<string>('R2_BUCKET_NAME');
  }

  async onModuleInit() {
    this.logger.debug(`Checking "${this.bucketName}" R2 bucket existence`);
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.info(`Connected to R2 bucket ${this.bucketName}`);
    } catch (error) {
      this.logger.error('Error checking or connecting to R2 bucket:', error);
      if (error.name === 'NotFound') {
        throw new InternalServerErrorException(
          `Bucket ${this.bucketName} does not exist or you do not have access`,
        );
      }
      throw new InternalServerErrorException(
        `Failed to connect to R2 bucket: ${error.message}`,
      );
    }
  }

  async uploadFile({
    key,
    body,
    contentType,
  }: {
    key: string;
    body: Buffer | Uint8Array | string | ReadableStream<any>;
    contentType: string;
  }): Promise<void> {
    this.logger.debug(
      `Uploading file "${key}" to R2 bucket "${this.bucketName}"`,
    );
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      this.logger.info(
        `File "${key}" uploaded successfully to R2 bucket "${this.bucketName}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to upload file "${key}" to R2 bucket "${this.bucketName}":`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to upload file "${key}": ${error.message}`,
      );
    }
  }

  async downloadFile(key: string): Promise<ReadableStream<any> | null> {
    this.logger.debug(
      `Downloading file "${key}" from R2 bucket "${this.bucketName}"`,
    );
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (response.Body) {
        const buffer = response.Body.transformToWebStream();
        this.logger.info(
          `File "${key}" downloaded successfully from R2 bucket "${this.bucketName}"`,
        );
        return buffer;
      } else {
        this.logger.warn(
          `File "${key}" downloaded from R2 bucket "${this.bucketName}" but body is empty.`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to download file "${key}" from R2 bucket "${this.bucketName}":`,
        error,
      );
      if (error.name === 'NoSuchKey') {
        throw new NotFoundException(
          `File "${key}" not found in bucket "${this.bucketName}"`,
        );
      }
      throw new InternalServerErrorException(
        `Failed to download file "${key}": ${error.message}`,
      );
    }
  }

  async downloadFileAsStream(key: string): Promise<Readable> {
    const readableStream = await this.downloadFile(key);
    const reader = readableStream.getReader();
    return new Readable({
      async read() {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null); // signal end of stream
        } else {
          this.push(Buffer.from(value)); // push chunk to Node.js Readable
        }
      },
    });
  }
}
