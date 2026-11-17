import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Clinica } from '../../shared/clinica/clinica';
import { Consulta } from '../../shared/clinica/modelos';
import { SECOES, secoesDoPerfil } from '../../shared/clinica/secoes';
import { FaixaPaciente } from '../../shared/faixa-paciente/faixa-paciente';
import { Icone } from '../../shared/icone/icone';
import { Perfil } from '../../shared/perfil';
import { TituloPagina } from '../../shared/titulo-pagina/titulo-pagina';
import { formatarData, paraISO } from '../../shared/util';

/** Prontuário do paciente: dados pessoais, responsável, atalhos e histórico de consultas. */
@Component({
  selector: 'app-prontuario',
  imports: [FaixaPaciente, Icone, RouterLink, TituloPagina],
  templateUrl: './prontuario.html',
})
export class Prontuario {
  private readonly clinica = inject(Clinica);

  /** Vem da rota: /:perfil/pacientes/:id */
  readonly id = input.required<string>();
  /** Vem do `data` da rota (psicologo ou psiquiatra). */
  readonly perfil = input<Perfil>('admin');
  protected readonly raiz = computed(() => `/${this.perfil()}`);

  protected readonly paciente = computed(() => this.clinica.paciente(this.id()));
  protected readonly nascimento = computed(() => formatarData(this.paciente()?.nascimento));
  protected readonly secoes = computed(() => secoesDoPerfil(this.perfil()).map((id) => SECOES[id]));
  protected readonly consultas = computed(() =>
    (this.paciente()?.consultas ?? []).map((c) => ({ ...c, dataBR: formatarData(c.data) })),
  );
  protected readonly proxima = computed<(Consulta & { dataBR: string }) | null>(() => this.consultas()
    .filter((c) => c.data >= paraISO(new Date()))
    .sort((a, b) => a.data.localeCompare(b.data))[0] ?? null);
  protected readonly ultima = computed<(Consulta & { dataBR: string }) | null>(() => this.consultas()
    .filter((c) => c.data < paraISO(new Date()))
    .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null);

  constructor() {
    effect(() => this.clinica.carregarDocumentos(this.id()));
    effect(() => this.clinica.carregarDiagnosticos(this.id()));
  }

}
