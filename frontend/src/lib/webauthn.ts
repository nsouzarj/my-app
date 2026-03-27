/**
 * frontend/src/lib/webauthn.ts
 * Utilitário para lidar com a API de Biometria do Navegador (WebAuthn)
 */

export const webauthn = {
  /**
   * Converte base64/string para ArrayBuffer (necessário para WebAuthn)
   */
  bufferFromBase64: (base64: string) => {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  },

  /**
   * Converte ArrayBuffer para base64
   */
  base64FromBuffer: (buffer: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  },

  /**
   * Registro de nova biometria
   */
  register: async (challenge: string, user: { id: string, name: string, displayName: string }) => {
    const options: CredentialCreationOptions = {
      publicKey: {
        challenge: webauthn.bufferFromBase64(challenge),
        rp: {
          name: "Finanças App",
          id: window.location.hostname
        },
        user: {
          id: webauthn.bufferFromBase64(user.id),
          name: user.name,
          displayName: user.displayName
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Força biometria do dispositivo (TouchID/FaceID/Fingerprint)
          userVerification: "required"
        },
        timeout: 60000
      }
    };

    const credential = await navigator.credentials.create(options) as PublicKeyCredential;
    
    // Extrair dados para enviar ao backend
    return {
      id: credential.id,
      rawId: webauthn.base64FromBuffer(credential.rawId),
      type: credential.type,
      publicKey: webauthn.base64FromBuffer((credential.response as any).getPublicKey?.() || new ArrayBuffer(0)),
    };
  },

  /**
   * Autenticação via biometria
   */
  authenticate: async (challenge: string) => {
    const options: CredentialRequestOptions = {
      publicKey: {
        challenge: webauthn.bufferFromBase64(challenge),
        allowCredentials: [], // Permitir qualquer credencial registrada neste domínio
        userVerification: "required",
        timeout: 60000
      }
    };

    const credential = await navigator.credentials.get(options) as PublicKeyCredential;

    return {
      id: credential.id,
      rawId: webauthn.base64FromBuffer(credential.rawId),
      type: credential.type,
    };
  },

  isSupported: () => {
    return !!(window.PublicKeyCredential && 
             navigator.credentials && 
             navigator.credentials.create);
  }
};
