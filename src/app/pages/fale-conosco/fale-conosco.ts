import { Component, computed, inject, input, signal } from '@angular/core';

import { Aviso } from '../../shared/aviso/aviso';
import { Icone } from '../../shared/icone/icone';
import { Perfil } from '../../shared/perfil';
import { TituloPagina } from '../../shared/titulo-pagina/titulo-pagina';
import { emailValido } from '../../shared/util';

/** Formulário "Fale conosco" da Ajuda. */
@Component({
  selector: 'app-fale-conosco',
  imports: [Icone, TituloPagina],
  templateUrl: './fale-conosco.html',
})
export class FaleConosco {
  private readonly aviso = inject(Aviso);

  readonly perfil = input<Perfil>('secretaria');
  protected readonly voltar = computed(() => `/${this.perfil()}/ajuda`);

  protected readonly nome = signal('');
  protected readonly email = signal('');
  protected readonly mensagem = signal('');
  protected readonly tentou = signal(false);

  protected readonly erros = computed(() => ({
    nome: this.nome().trim().length < 3 ? 'Informe seu nome completo.' : '',
    email: this.email().trim() && !emailValido(this.email()) ? 'E-mail inválido.' : '',
    mensagem: this.mensagem().trim().length < 10 ? 'Escreva uma mensagem com pelo menos 10 caracteres.' : '',
  }));

  protected enviar(): void {
    this.tentou.set(true);
    const e = this.erros();
    if (e.nome || e.email || e.mensagem) return;
    // TODO (back-end): enviar a mensagem para a equipe de suporte.
    this.aviso.mostrar('Mensagem enviada! Nossa equipe responderá em breve.');
    this.nome.set('');
    this.email.set('');
    this.mensagem.set('');
    this.tentou.set(false);
  }
}
