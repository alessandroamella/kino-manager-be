Applicativo web Kinò Cafè:

Deve permettere:

- Registrazione - autenticazione

Per farlo usa i seguenti dati:

- Nome
- Cognome
- Numero di telefono
- Cittadinanza (se italiano: codice fiscale <=> data di nascita && provincia di nascita)
- Codice fiscale (se input corretto, AUTOGENERA campi on blur)
- Data di nascita (vedi sopra)
- Provincia di nascita (vedi sopra)

Problema degli account fake:

- Un utente può registrarsi con dati a caso
- Si può mettere un CAPTCHA per provare a limitare le richieste da bot, ma lo stesso non mitiga il problema sottostante
- Visto che le tessere di Almo sono limitate, bisogna assicurarsi che ogni tesserato sia effettivamente un umano e vero
- Per farlo ho pensato che il processo di registrazione deve terminare, per possedere la tessera ed essere ultimato, ad una VERIFICA (dell'identità), che può avvenire in due modi:

1. Tramite CIE (Carta d'Identità Elettronica): la CIE è una tessera che è possibile leggere (e usare per verificare l'identità) via NFC, esistono SDK per Android (https://github.com/italia/cieid-android-sdk) e Python (https://github.com/italia/cie-nis-python-sdk). La domanda è se è possibile utilizzare la Web NFC API per effettuare le stesse operazioni, ma via web. In tal modo, dal sito, sarebbe possibile verificare la propria identità scansionando la tessera con il lettore NFC del proprio telefono / tablet, senza dover utilizzare app separate né alcun intervento manuale.
2. Manualmente, mostrando un documento d'identità alla cassa
