
package com.neurovita.dto;

public class CadastroSecretariaResponse {

    private final SecretariaResponse secretaria;
    private final boolean emailBoasVindasEnviado;

    public CadastroSecretariaResponse(
            SecretariaResponse secretaria,
            boolean emailBoasVindasEnviado) {

        this.secretaria = secretaria;
        this.emailBoasVindasEnviado = emailBoasVindasEnviado;
    }

    public SecretariaResponse getSecretaria() {
        return secretaria;
    }

    public boolean isEmailBoasVindasEnviado() {
        return emailBoasVindasEnviado;
    }
}
