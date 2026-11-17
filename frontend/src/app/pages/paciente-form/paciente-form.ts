import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Aviso } from '../../shared/aviso/aviso';
import { Clinica } from '../../shared/clinica/clinica';
import { Dialogo } from '../../shared/dialogo/dialogo';
import { Icone } from '../../shared/icone/icone';
import { Perfil } from '../../shared/perfil';
import { TituloPagina } from '../../shared/titulo-pagina/titulo-pagina';
import {
  cpfValido, deISO, emailValido, formatarCpf, formatarTelefone, idadeDe, paraISO, telefoneValido,
} from '../../shared/util';

interface Formulario {
  nome: string; nascimento: string; email: string; cpf: string; telefone: string;
  cep: string; cidade: string; endereco: string; numeroEndereco: string; complemento: string; bairro: string;
  inicio: string; encerramento: string; rTelefone2: string;
  rNome: string; rNascimento: string; rEmail: string; rParentesco: string; rTelefone: string; rCpf: string;
  rId?: string;
  responsaveisExtras: { id?: string; nome: string; nascimento: string; email: string; parentesco: string; telefone: string; cpf: string }[];
  possuiPlano: boolean; plano: string; carteirinha: string; validade: string;
  ativo: boolean;
}

type Campo = keyof Formulario;

export function erroPlanoSaude(possuiPlano: boolean, nome: string): string | null {
  return possuiPlano && !nome.trim() ? 'Informe o plano de saúde.' : null;
}

const VAZIO: Formulario = {
  nome: '', nascimento: '', email: '', cpf: '', telefone: '',
  cep: '', cidade: '', endereco: '', numeroEndereco: '', complemento: '', bairro: '', inicio: '', encerramento: '', rTelefone2: '',
  rNome: '', rNascimento: '', rEmail: '', rParentesco: '', rTelefone: '', rCpf: '',
  responsaveisExtras: [],
  possuiPlano: false, plano: '', carteirinha: '', validade: '', ativo: true,
};

function dataParaCampo(iso?: string | null): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '';
}

function dataParaIso(valor: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
  if (!partes) return null;
  const [, dia, mes, ano] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (data.getFullYear() !== Number(ano) || data.getMonth() !== Number(mes) - 1 || data.getDate() !== Number(dia)) return null;
  return `${ano}-${mes}-${dia}`;
}

function mascararData(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return digitos.length > 4 ? `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
    : digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

/** Cadastrar novo paciente ou editar um paciente existente. */
@Component({
  selector: 'app-paciente-form',
  imports: [Dialogo, Icone, TituloPagina],
  templateUrl: './paciente-form.html',
})
export class PacienteForm {
  private readonly clinica = inject(Clinica);
  private readonly aviso = inject(Aviso);
  private readonly router = inject(Router);

  readonly perfil = input<Perfil>('secretaria');
  /** Sem id = cadastro novo. */
  readonly id = input<string>();

  protected readonly hoje = paraISO(new Date());
  protected readonly f = signal<Formulario>({ ...VAZIO });
  protected readonly tentou = signal(false);
  protected readonly confirmando = signal(false);

  private carregado = false;

  protected readonly edicao = computed(() => !!this.id());
  protected readonly existente = computed(() => this.clinica.paciente(this.id()));
  protected readonly voltar = computed(() => `/${this.perfil()}/pacientes`);

  protected readonly menorDeIdade = computed(() => {
    const nascimento = dataParaIso(this.f().nascimento);
    return !!nascimento && idadeDe(nascimento) < 18;
  });

  /** Mensagens de erro de cada campo (vazio = campo certo). */
  protected readonly erros = computed(() => {
    const f = this.f();
    const e: Partial<Record<Campo, string>> = {};
    if (f.nome.trim().length < 3) e.nome = 'Informe o nome completo.';
    const nascimentoISO = dataParaIso(f.nascimento);
    const inicioISO = dataParaIso(f.inicio);
    const encerramentoISO = f.encerramento.trim() ? dataParaIso(f.encerramento) : null;
    if (!f.nascimento.trim()) e.nascimento = 'Informe a data de nascimento.';
    else if (!nascimentoISO) e.nascimento = 'Informe uma data válida no formato DD/MM/AAAA.';
    else if (deISO(nascimentoISO) > new Date()) e.nascimento = 'A data não pode ser no futuro.';
    if (!/^\d{5}-?\d{3}$/.test(f.cep.replace(/\s/g, ''))) e.cep = 'Informe um CEP válido.';
    if (!f.cidade.trim()) e.cidade = 'Informe a cidade.';
    if (!f.endereco.trim()) e.endereco = 'Informe o endereço.';
    if (!f.numeroEndereco.trim()) e.numeroEndereco = 'Informe o número.';
    if (!f.bairro.trim()) e.bairro = 'Informe o bairro.';
    if (!f.inicio.trim()) e.inicio = 'Informe a data de início.';
    else if (!inicioISO) e.inicio = 'Informe uma data válida no formato DD/MM/AAAA.';
    if (f.encerramento.trim() && !encerramentoISO) e.encerramento = 'Informe uma data válida no formato DD/MM/AAAA.';
    else if (inicioISO && encerramentoISO && encerramentoISO < inicioISO) e.encerramento = 'O encerramento não pode ser anterior ao início.';
    if (f.email.trim() && !emailValido(f.email)) e.email = 'E-mail inválido.';
    if (!f.cpf.trim()) e.cpf = 'Informe o CPF.';
    else if (!cpfValido(f.cpf)) e.cpf = 'CPF inválido.';
    if (f.telefone.trim() && !telefoneValido(f.telefone)) e.telefone = 'Telefone inválido.';

    if (!f.rNome.trim()) e.rNome = 'Informe o nome do responsável.';
    if (!f.rParentesco.trim()) e.rParentesco = 'Informe o grau de parentesco.';
    if (!f.rTelefone.trim() || !telefoneValido(f.rTelefone)) e.rTelefone = 'Informe um telefone válido do responsável.';
    if (!f.rEmail.trim() || !emailValido(f.rEmail)) e.rEmail = 'Informe um e-mail válido do responsável.';
    if (!f.rCpf.trim() || !cpfValido(f.rCpf)) e.rCpf = 'Informe um CPF válido do responsável.';
    if (!f.rTelefone2.trim() || !telefoneValido(f.rTelefone2)) e.rTelefone2 = 'Informe um telefone válido.';
    if (f.rTelefone.trim() && !telefoneValido(f.rTelefone)) e.rTelefone = 'Telefone inválido.';
    for (const r of f.responsaveisExtras) {
      if (!r.nome.trim() && (r.telefone.trim() || r.cpf.trim() || r.email.trim() || r.parentesco.trim())) {
        e.rNome = 'Informe o nome de todos os responsáveis adicionados.';
        break;
      }
      if (r.nome.trim() && !r.parentesco.trim()) e.rNome = 'Informe o grau de parentesco de cada responsável.';
      if (r.nome.trim() && (!r.telefone.trim() || !telefoneValido(r.telefone))) e.rNome = 'Informe um telefone válido para cada responsável.';
      if (r.email.trim() && !emailValido(r.email)) e.rNome = 'Informe um e-mail válido para cada responsável.';
      if (r.cpf.trim() && !cpfValido(r.cpf)) e.rNome = 'Informe um CPF válido para cada responsável.';
    }
    const erroPlano = erroPlanoSaude(f.possuiPlano, f.plano);
    if (erroPlano) e.plano = erroPlano;
    return e;
  });

  constructor() {
    // Na edição, preenche o formulário com os dados do paciente (uma vez).
    effect(() => {
      const p = this.existente();
      if (this.carregado || !p) return;
      this.carregado = true;
      const todosResponsaveis = p.responsaveis?.length
        ? p.responsaveis
        : (p.responsavel.nome ? [{ ...p.responsavel, id: p.responsavelId }] : []);
      const principal = todosResponsaveis[0] ?? p.responsavel;
      this.f.set({
        nome: p.nome, nascimento: dataParaCampo(p.nascimento), email: p.email === '—' ? '' : p.email, cpf: p.cpf, telefone: p.telefone === '—' ? '' : p.telefone,
        cep: p.cep ?? '', cidade: p.cidade ?? '', endereco: p.endereco ?? '', numeroEndereco: p.numeroEndereco ?? '',
        complemento: p.complemento ?? '', bairro: p.bairro ?? '', inicio: dataParaCampo(p.dataInicio),
        encerramento: dataParaCampo(p.dataEncerramento),
        rId: principal.id, rNome: principal.nome === '—' ? '' : principal.nome, rNascimento: principal.nascimento ?? '',
        rEmail: principal.email ?? '', rParentesco: principal.relacao === '—' ? '' : principal.relacao,
        rTelefone: principal.telefone === '—' ? '' : principal.telefone, rTelefone2: principal.telefoneSecundario ?? '', rCpf: principal.cpf ?? '',
        responsaveisExtras: todosResponsaveis.slice(1).map((r) => ({
          id: r.id, nome: r.nome, nascimento: r.nascimento ?? '', email: r.email ?? '',
          parentesco: r.relacao, telefone: r.telefone, cpf: r.cpf ?? '',
        })),
        possuiPlano: p.plano.possui, plano: p.plano.nome, carteirinha: p.plano.carteirinha, validade: p.plano.validade,
        ativo: p.status !== 'inativo',
      });
    });
  }

  protected mostrarErro(campo: Campo): string {
    return this.tentou() ? (this.erros()[campo] ?? '') : '';
  }

  protected digitar(campo: Campo, evento: Event): void {
    let valor = (evento.target as HTMLInputElement).value;
    if (campo === 'cpf' || campo === 'rCpf') valor = formatarCpf(valor);
    if (campo === 'telefone' || campo === 'rTelefone' || campo === 'rTelefone2') valor = formatarTelefone(valor);
    if (campo === 'nascimento' || campo === 'inicio' || campo === 'encerramento') valor = mascararData(valor);
    this.f.update((atual) => ({ ...atual, [campo]: valor }));
    // O campo mostra a máscara mesmo se o navegador tentar guardar o texto digitado.
    (evento.target as HTMLInputElement).value = valor;
  }

  protected definir<K extends Campo>(campo: K, valor: Formulario[K]): void {
    this.f.update((atual) => ({ ...atual, [campo]: valor }));
  }

  protected adicionarResponsavel(): void {
    this.f.update((atual) => ({
      ...atual,
      responsaveisExtras: [...atual.responsaveisExtras, { nome: '', nascimento: '', email: '', parentesco: '', telefone: '', cpf: '' }],
    }));
  }

  protected removerResponsavel(indice: number): void {
    this.f.update((atual) => ({
      ...atual,
      responsaveisExtras: atual.responsaveisExtras.filter((_, i) => i !== indice),
    }));
  }

  protected digitarExtra(indice: number, campo: 'nome' | 'nascimento' | 'email' | 'parentesco' | 'telefone' | 'cpf', evento: Event): void {
    let valor = (evento.target as HTMLInputElement).value;
    if (campo === 'cpf') valor = formatarCpf(valor);
    if (campo === 'telefone') valor = formatarTelefone(valor);
    this.f.update((atual) => ({
      ...atual,
      responsaveisExtras: atual.responsaveisExtras.map((r, i) => i === indice ? { ...r, [campo]: valor } : r),
    }));
    (evento.target as HTMLInputElement).value = valor;
  }

  protected cadastrar(): void {
    this.tentou.set(true);
    if (Object.keys(this.erros()).length) {
      this.aviso.mostrar('Corrija os campos destacados para continuar.');
      return;
    }
    this.confirmando.set(true);
  }

  protected async confirmar(): Promise<void> {
    const f = this.f();
    try {
    const paciente = await this.clinica.salvarPaciente(
      {
        nome: f.nome.trim(), nascimento: dataParaIso(f.nascimento)!, email: f.email, cpf: f.cpf, telefone: f.telefone,
        cep: f.cep, cidade: f.cidade, endereco: f.endereco, numeroEndereco: f.numeroEndereco,
        complemento: f.complemento, bairro: f.bairro, dataInicio: dataParaIso(f.inicio)!,
        dataEncerramento: dataParaIso(f.encerramento) ?? undefined,
        responsavel: { id: f.rId, nome: f.rNome.trim(), nascimento: f.rNascimento, email: f.rEmail.trim(), relacao: f.rParentesco.trim(), telefone: f.rTelefone, telefoneSecundario: f.rTelefone2, cpf: f.rCpf, endereco: '' },
        responsaveis: [
          { id: f.rId, nome: f.rNome.trim(), nascimento: f.rNascimento, email: f.rEmail.trim(), relacao: f.rParentesco.trim(), telefone: f.rTelefone, telefoneSecundario: f.rTelefone2, cpf: f.rCpf, endereco: '' },
          ...f.responsaveisExtras.map((r) => ({ id: r.id, nome: r.nome.trim(), nascimento: r.nascimento, email: r.email.trim(), relacao: r.parentesco.trim(), telefone: r.telefone, cpf: r.cpf, endereco: '' })),
        ].filter((r) => r.nome),
        plano: { possui: f.possuiPlano, nome: f.possuiPlano ? f.plano.trim() : '', carteirinha: f.possuiPlano ? f.carteirinha.trim() : '', validade: f.possuiPlano ? f.validade : '' },
        ativo: f.ativo,
      },
      this.id(),
    );
    this.confirmando.set(false);
    this.aviso.mostrar(this.edicao() ? `Dados de ${paciente.nome} atualizados.` : 'Paciente cadastrado com sucesso.');
    this.router.navigateByUrl(this.voltar());
    } catch (erro) {
      console.error('Falha ao salvar paciente:', erro);
      this.aviso.mostrar('Não foi possível salvar o paciente. Verifique os dados e tente novamente.');
    }
  }

  protected cancelar(): void {
    this.router.navigateByUrl(this.voltar());
  }

}
