import { Request } from 'express';

export type JwtPayload = Request['user'];
