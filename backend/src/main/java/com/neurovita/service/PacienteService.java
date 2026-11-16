package com.neurovita.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.neurovita.dto.CadastroPacienteResponse;
import com.neurovita.dto.PacienteRequest;
import com.neurovita.dto.PacienteResponse;
import com.neurovita.dto.VinculoResponsavelRequest;
import com.neurovita.exception.ResourceNotFoundException;
import com.neurovita.model.Paciente;
import com.neurovita.model.Responsavel;
import com.neurovita.model.Usuario;
import com.neurovita.model.VinculoResponsavel;
import com.neurovita.repository.PacienteRepository;
import com.neurovita.repository.ResponsavelRepository;
import com.neurovita.repository.UsuarioRepository;
import com.neurovita.repository.VinculoResponsavelRepository;
import com.neurovita.repository.VinculoProfissionalPacienteRepository;
import com.neurovita.model.VinculoProfissionalPaciente;

@Service
public class PacienteService {

        private static final String PERFIL_PACIENTE = "PACIENTE";

        private final PacienteRepository pacienteRepository;
        private final UsuarioRepository usuarioRepository;
        private final ResponsavelRepository responsavelRepository;
        private final VinculoResponsavelRepository vinculoRepository;
        private final VinculoProfissionalPacienteRepository vinculoProfissionalRepository;

        public PacienteService(
                PacienteRepository pacienteRepository,
                UsuarioRepository usuarioRepository,
                ResponsavelRepository responsavelRepository,
                VinculoResponsavelRepository vinculoRepository,
                VinculoProfissionalPacienteRepository vinculoProfissionalRepository) {

        this.pacienteRepository = pacienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.responsavelRepository = responsavelRepository;
        this.vinculoRepository = vinculoRepository;
        this.vinculoProfissionalRepository = vinculoProfissionalRepository;
        }

        public CadastroPacienteResponse salvar(PacienteRequest request) {
        exigirCadastroPaciente();

        validarEmailDisponivel(request.getEmail(), null);
        validarPlanoSaude(request);

        List<VinculoResponsavelRequest> responsaveis =
                validarResponsaveis(request);

        Paciente paciente = new Paciente();
        preencherPaciente(paciente, request, true);
        aplicarPlanoSaude(paciente, request, true);

        Paciente pacienteSalvo = pacienteRepository.save(paciente);
        try {
                salvarVinculos(pacienteSalvo.getId(), responsaveis);

        } catch (RuntimeException e) {
                limparCadastroIncompleto(pacienteSalvo.getId(), e);

                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Não foi possível concluir o cadastro do paciente.",
                        e);
        }

        return new CadastroPacienteResponse(
                criarResposta(pacienteSalvo),
                null);
        }

        public List<PacienteResponse> listarTodos() {
        exigirAdministradorOuSecretaria();

        return pacienteRepository.findAll()
                .stream()
                .map(this::criarResposta)
                .toList();
}

        public PacienteResponse buscarPorId(String id) {
        exigirAdministradorOuSecretaria();

        Paciente paciente = buscarPaciente(id);

        return criarResposta(paciente);
    }

    public PacienteResponse atualizar(
            String id,
            PacienteRequest request) {

        exigirAdministradorOuSecretaria();

        Paciente paciente = buscarPaciente(id);

        if (request.getEmail() != null) {
                validarEmailDisponivel(request.getEmail(), id);
        }
        List<VinculoResponsavelRequest> responsaveis = request.getResponsaveis() == null
                ? null
                : validarResponsaveis(request);
        if (responsaveis == null
                && Period.between(request.getDataNascimento(), LocalDate.now()).getYears() < 18
                && vinculoRepository.findByPacienteId(id).isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Pacientes menores de 18 anos devem ter pelo menos um responsável vinculado.");
        }

        preencherPaciente(paciente, request, false);
        aplicarPlanoSaude(paciente, request, false);

        Paciente atualizado = pacienteRepository.save(paciente);

        if (responsaveis != null) {
                atualizarVinculos(atualizado.getId(), responsaveis);
        }

        return criarResposta(atualizado);
    }

    public void deletar(String id) {
        exigirAdministradorOuSecretaria();

        Paciente paciente = buscarPaciente(id);
        // Exclusão pela interface significa inativação para preservar
        // consultas, documentos clínicos e relacionamentos do paciente.
        paciente.setAtivo(false);
        pacienteRepository.save(paciente);
    }

    private Paciente buscarPaciente(String id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Paciente não encontrado"));
    }

    private void preencherPaciente(
            Paciente paciente,
            PacienteRequest request,
            boolean novoCadastro) {

        paciente.setNome(request.getNome());
        paciente.setDataNascimento(request.getDataNascimento());
        if (request.getEmail() != null) paciente.setEmail(request.getEmail());
        if (request.getCpf() != null) paciente.setCpf(request.getCpf());
        if (request.getTelefone() != null) paciente.setTelefone(request.getTelefone());
        if (request.getEndereco() != null) paciente.setEndereco(request.getEndereco());
        if (request.getCep() != null && !request.getCep().isBlank()) {
                paciente.setCep(request.getCep());
        }
        if (request.getCidade() != null && !request.getCidade().isBlank()) {
                paciente.setCidade(request.getCidade());
        }
        if (request.getAtivo() != null) paciente.setAtivo(request.getAtivo());
        else if (novoCadastro && paciente.getAtivo() == null) paciente.setAtivo(true);

    }

    private void validarPlanoSaude(PacienteRequest request) {
        if (Boolean.TRUE.equals(request.getPossuiPlanoSaude())
                && (request.getPlanoSaude() == null
                        || request.getPlanoSaude().isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o nome do plano de saúde.");
        }
    }

    private void aplicarPlanoSaude(
            Paciente paciente, PacienteRequest request, boolean novoCadastro) {
        Boolean possuiPlanoSolicitado = request.getPossuiPlanoSaude();
        if (possuiPlanoSolicitado == null) {
            if (novoCadastro) {
                limparPlanoSaude(paciente);
            }
            return;
        }

        if (!possuiPlanoSolicitado) {
            limparPlanoSaude(paciente);
            return;
        }

        String nomePlano = request.getPlanoSaude();
        if (nomePlano == null) {
            nomePlano = Boolean.TRUE.equals(paciente.getPossuiPlanoSaude())
                    ? paciente.getPlanoSaude()
                    : null;
        }
        if (nomePlano == null || nomePlano.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o nome do plano de saúde.");
        }

        paciente.setPossuiPlanoSaude(true);
        paciente.setPlanoSaude(nomePlano.trim());

        if (request.getNumeroCarteirinha() != null) {
            String numeroCarteirinha = request.getNumeroCarteirinha().trim();
            paciente.setNumeroCarteirinha(
                    numeroCarteirinha.isEmpty() ? null : numeroCarteirinha);
        }
        if (request.getValidadePlano() != null) {
            paciente.setValidadePlano(request.getValidadePlano());
        }
    }

    private void limparPlanoSaude(Paciente paciente) {
        paciente.setPossuiPlanoSaude(false);
        paciente.setPlanoSaude(null);
        paciente.setNumeroCarteirinha(null);
        paciente.setValidadePlano(null);
    }

    private List<VinculoResponsavelRequest> validarResponsaveis(
            PacienteRequest request) {

        LocalDate nascimento = request.getDataNascimento();

        if (nascimento == null || !nascimento.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe uma data de nascimento válida.");
        }

        List<VinculoResponsavelRequest> responsaveis =
                request.getResponsaveis() == null
                        ? List.of()
                        : request.getResponsaveis();

        boolean menorDeIdade =
                Period.between(nascimento, LocalDate.now()).getYears() < 18;

        if (menorDeIdade && responsaveis.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pacientes menores de 18 anos devem ter "
                    + "pelo menos um responsável vinculado.");
        }

        Set<String> idsInformados = new HashSet<>();

        for (VinculoResponsavelRequest vinculo : responsaveis) {
            if (vinculo == null
                    || vinculo.getResponsavelId() == null
                    || vinculo.getResponsavelId().isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O ID do responsável é obrigatório.");
            }

            String responsavelId = vinculo.getResponsavelId().trim();

            if (vinculo.getGrauParentesco() == null
                    || vinculo.getGrauParentesco().isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O grau de parentesco é obrigatório.");
            }

            if (!idsInformados.add(responsavelId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O mesmo responsável não pode ser informado "
                        + "mais de uma vez para o paciente.");
            }

            Responsavel responsavel = responsavelRepository
                    .findById(responsavelId)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST,
                                    "Responsável não encontrado: "
                                    + responsavelId));

            // Confirma que o responsável existe antes de salvar
            // o paciente ou modificar os vínculos.
            if (responsavel.getId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O responsável informado não possui um ID válido.");
            }
        }

        return responsaveis;
    }

    private void salvarVinculos(
            String pacienteId,
            List<VinculoResponsavelRequest> responsaveis) {

        for (VinculoResponsavelRequest request : responsaveis) {
            VinculoResponsavel vinculo = new VinculoResponsavel();

            vinculo.setPacienteId(pacienteId);
            vinculo.setResponsavelId(
                    request.getResponsavelId().trim());
            vinculo.setGrauParentesco(
                    request.getGrauParentesco().trim());

            vinculoRepository.save(vinculo);
        }
    }

    private void atualizarVinculos(
            String pacienteId,
            List<VinculoResponsavelRequest> responsaveis) {

        List<VinculoResponsavel> existentes =
                vinculoRepository.findByPacienteId(pacienteId);

        Map<String, VinculoResponsavel> porResponsavel =
                new HashMap<>();

        for (VinculoResponsavel vinculo : existentes) {
            porResponsavel.put(
                    vinculo.getResponsavelId(),
                    vinculo);
        }

        Set<String> idsMantidos = new HashSet<>();

        for (VinculoResponsavelRequest request : responsaveis) {
            String responsavelId =
                    request.getResponsavelId().trim();

            idsMantidos.add(responsavelId);

            VinculoResponsavel existente =
                    porResponsavel.get(responsavelId);

            if (existente != null) {
                existente.setGrauParentesco(
                        request.getGrauParentesco().trim());

                vinculoRepository.save(existente);
            } else {
                VinculoResponsavel novo = new VinculoResponsavel();

                novo.setPacienteId(pacienteId);
                novo.setResponsavelId(responsavelId);
                novo.setGrauParentesco(
                        request.getGrauParentesco().trim());

                vinculoRepository.save(novo);
            }
        }

        // Exclui somente os vínculos que foram retirados
        // da lista enviada na atualização do paciente.
        List<VinculoResponsavel> removidos = new ArrayList<>();

        for (VinculoResponsavel existente : existentes) {
            if (!idsMantidos.contains(existente.getResponsavelId())) {
                removidos.add(existente);
            }
        }

        if (!removidos.isEmpty()) {
            vinculoRepository.deleteAll(removidos);
        }
    }

    private PacienteResponse criarResposta(Paciente paciente) {
        List<VinculoResponsavel> vinculos =
                vinculoRepository.findByPacienteId(paciente.getId());

        List<VinculoProfissionalPaciente> vinculosProfissionais =
                vinculoProfissionalRepository != null
                        ? vinculoProfissionalRepository.findByPacienteIdAndEncerradoEmIsNullOrderByIniciadoEmDesc(paciente.getId())
                        : java.util.Collections.emptyList();

        return new PacienteResponse(paciente, vinculos, vinculosProfissionais);
    }

    private void limparCadastroIncompleto(String pacienteId, RuntimeException erroOriginal) {

        try {
            vinculoRepository.deleteAll(
                    vinculoRepository.findByPacienteId(pacienteId));
        } catch (RuntimeException erroLimpeza) {
            erroOriginal.addSuppressed(erroLimpeza);
        }

        try {
            pacienteRepository.deleteById(pacienteId);
        } catch (RuntimeException erroLimpeza) {
            erroOriginal.addSuppressed(erroLimpeza);
        }
    }

    private void validarEmailDisponivel(
            String email,
            String pacienteId) {

        if (email == null || email.isBlank()) return;

        pacienteRepository.findByEmailIgnoreCase(email)
                .filter(paciente ->
                        !paciente.getId().equals(pacienteId))
                .ifPresent(paciente -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Este e-mail já está associado a outro paciente.");
                });

        usuarioRepository.findByEmailIgnoreCase(email)
                .filter(usuario -> !PERFIL_PACIENTE.equals(
                        usuario.getPerfil() == null
                                ? ""
                                : usuario.getPerfil().toUpperCase(
                                        Locale.ROOT)))
                .ifPresent(usuario -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Este e-mail já está associado a outra conta.");
                });

        usuarioRepository.findByEmailIgnoreCase(email)
                .filter(usuario ->
                        pacienteId == null
                                || !pacienteId.equals(
                                        usuario.getEntidadeId()))
                .ifPresent(usuario -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Este e-mail já possui uma conta de acesso.");
                });
    }

    private void exigirAdministradorOuSecretaria() {
        boolean autorizado = obterAutenticacao()
                .getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMINISTRADOR")
                        || a.getAuthority().equals("ROLE_SECRETARIA"));

        if (!autorizado) {
            throw new AccessDeniedException(
                    "Somente administradores ou secretarias podem "
                    + "cadastrar pacientes");
        }
    }

    private void exigirCadastroPaciente() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao.getAuthorities().stream().noneMatch(a ->
                        a.getAuthority().equals("ROLE_ADMINISTRADOR")
                        || a.getAuthority().equals("ROLE_SECRETARIA"))) {
            throw new AccessDeniedException("Perfil sem permissão para cadastrar pacientes.");
        }
    }

    private Authentication obterAutenticacao() {
        Authentication autenticacao =
                SecurityContextHolder.getContext().getAuthentication();

        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || autenticacao.getAuthorities().stream()
                        .anyMatch(a ->
                                a.getAuthority().equals("ROLE_ANONYMOUS"))) {
            throw new AccessDeniedException("Usuário não autenticado");
        }

        return autenticacao;
    }
}
