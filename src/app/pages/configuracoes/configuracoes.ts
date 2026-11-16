import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Aviso } from '../../shared/aviso/aviso';
import { Configuracoes, Preferencias } from '../../shared/configuracoes';
import { hojeAtual } from '../../shared/relogio';
import { Dialogo } from '../../shared/dialogo/dialogo';
import { Icone } from '../../shared/icone/icone';
import { ListaSuspensa, OpcaoLista } from '../../shared/lista-suspensa/lista-suspensa';
import { Perfil } from '../../shared/perfil';
import { TituloPagina } from '../../shared/titulo-pagina/titulo-pagina';
import { emailValido } from '../../shared/util';
import { validarNovaSenha } from '../../shared/validacao-senha';
import { Auth } from '../../shared/auth';

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type Interruptor = 'lembreteEmail' | 'lembreteAlertas' | 'avisoSistema' | 'doisFatores';

/** Tela Configurações: perfil, preferências do sistema, notificações, segurança e aparência. */
@Component({
  selector: 'app-configuracoes-pagina',
  imports: [Dialogo, Icone, ListaSuspensa, TituloPagina],
  templateUrl: './configuracoes.html',
})
export class ConfiguracoesPagina {
  private readonly servico = inject(Configuracoes);
  private readonly aviso = inject(Aviso);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** Vem do `data` da rota (secretaria ou admin). */
  readonly perfil = input<Perfil>('secretaria');

  /** O que está na tela (só vale de verdade depois de clicar em Salvar). */
  protected readonly p = signal<Preferencias>({ ...this.servico.salvas() });
  protected readonly dadosPerfil = computed(() => ({
    ...this.servico.perfis()[this.perfil()],
    nome: this.auth.obterNome() ?? this.servico.perfis()[this.perfil()].nome,
    email: this.auth.obterEmail() ?? this.servico.perfis()[this.perfil()].email,
  }));

  protected readonly idiomas: OpcaoLista[] = [{ valor: 'pt', rotulo: 'Português' }, { valor: 'en', rotulo: 'Inglês' }];
  protected readonly formatos: OpcaoLista[] = ['DD/MM/AAAA', 'MM/DD/AAAA', 'AAAA/MM/DD'].map((f) => ({ valor: f, rotulo: f }));
  protected readonly duracoes: OpcaoLista[] = ['30', '40', '50', '60'].map((m) => ({ valor: m, rotulo: `${m} Minutos` }));
  protected readonly dias = DIAS;
  protected readonly nomeDoDia = computed(() => DIAS[this.p().inicioSemana]);

  protected definir<K extends keyof Preferencias>(campo: K, valor: Preferencias[K]): void {
    this.p.update((atual) => ({ ...atual, [campo]: valor }));
  }

  protected alternar(campo: Interruptor): void {
    this.definir(campo, !this.p()[campo]);
  }

  protected salvar(): void {
    this.servico.salvar(this.p());
    this.aviso.mostrar('Configurações salvas.');
  }

  protected restaurar(): void {
    this.p.set(this.servico.restaurarPadrao());
    this.aviso.mostrar('Padrão restaurado. Clique em Salvar para aplicar.');
  }

  // ---------- Editar perfil ----------
  protected readonly editandoPerfil = signal(false);
  protected readonly nomeEd = signal('');
  protected readonly emailEd = signal('');
  protected readonly erroPerfil = signal('');

  protected abrirPerfil(): void {
    this.nomeEd.set(this.dadosPerfil().nome);
    this.emailEd.set(this.dadosPerfil().email);
    this.erroPerfil.set('');
    this.editandoPerfil.set(true);
  }

  protected salvarPerfil(): void {
    if (this.nomeEd().trim().length < 3) return this.erroPerfil.set('Informe o nome completo.');
    if (!emailValido(this.emailEd())) return this.erroPerfil.set('E-mail inválido.');
    this.servico.salvarPerfil(this.perfil(), { ...this.dadosPerfil(), nome: this.nomeEd().trim(), email: this.emailEd().trim() });
    this.editandoPerfil.set(false);
    this.aviso.mostrar('Perfil atualizado.');
  }

  // ---------- Alterar senha ----------
  protected readonly alterandoSenha = signal(false);
  protected readonly senhaAtual = signal('');
  protected readonly senhaNova = signal('');
  protected readonly senhaConfirmar = signal('');
  protected readonly erroSenha = signal('');

  protected abrirSenha(): void {
    this.senhaAtual.set('');
    this.senhaNova.set('');
    this.senhaConfirmar.set('');
    this.erroSenha.set('');
    this.alterandoSenha.set(true);
  }

  protected salvarSenha(): void {
    if (!this.senhaAtual()) return this.erroSenha.set('Informe a senha atual.');
    const erro = validarNovaSenha(this.senhaNova(), this.senhaConfirmar());
    if (erro) return this.erroSenha.set(erro);
    this.auth.alterarSenhaAutenticada(this.senhaAtual(), this.senhaNova(), this.senhaConfirmar()).subscribe({
      next: () => {
        this.alterandoSenha.set(false);
        this.aviso.mostrar('Senha alterada. Entre novamente com a nova senha.');
        this.router.navigateByUrl('/');
      },
      error: (erro) => this.erroSenha.set(erro?.error?.mensagem ?? erro?.error?.message ?? 'Não foi possível alterar a senha. Confira a senha atual e tente novamente.'),
    });
  }

  // ---------- Início da semana (calendário) ----------
  protected readonly escolhendoSemana = signal(false);
  protected readonly semanaTemp = signal(1);
  private readonly mesVisivel = signal({ ano: Number(hojeAtual().slice(0, 4)), mes: Number(hojeAtual().slice(5, 7)) - 1 });

  protected readonly calendario = computed(() => {
    const { ano, mes } = this.mesVisivel();
    const ini = this.semanaTemp();
    const vazios = (new Date(ano, mes, 1).getDay() - ini + 7) % 7;
    const total = new Date(ano, mes + 1, 0).getDate();
    const agora = hojeAtual();
    const hoje = Number(agora.slice(0, 4)) === ano && Number(agora.slice(5, 7)) - 1 === mes ? Number(agora.slice(8, 10)) : 0;
    return {
      titulo: MESES[mes],
      cabecalho: Array.from({ length: 7 }, (_, i) => DIAS_CURTOS[(ini + i) % 7]),
      dias: [...Array<number>(vazios).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)],
      hoje,
    };
  });

  protected abrirSemana(): void {
    this.semanaTemp.set(this.p().inicioSemana);
    this.escolhendoSemana.set(true);
  }

  protected mudarMes(passo: number): void {
    this.mesVisivel.update(({ ano, mes }) => {
      const d = new Date(ano, mes + passo, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  }

  protected confirmarSemana(): void {
    this.definir('inicioSemana', this.semanaTemp());
    this.escolhendoSemana.set(false);
  }
}
