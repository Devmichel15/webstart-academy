import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProjectFormModal } from "../pages/community/ProjectFormModal.jsx";

const PATH_A = "22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/0-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg";
const PATH_B = "22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/1-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg";
const PATH_C = "22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/2-cccccccc-cccc-4ccc-8ccc-cccccccccccc.jpg";

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview-url");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
});

function makeFile(name, type, bytes = 16) {
  return new File([new Uint8Array(bytes)], name, { type });
}

function renderModal(props = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <ProjectFormModal
      open
      project={null}
      submitting={false}
      onClose={onClose}
      onSave={onSave}
      {...props}
    />,
  );
  const fileInput = utils.container.querySelector('input[type="file"]');
  return { ...utils, onSave, onClose, fileInput };
}

function pickFiles(input, files) {
  fireEvent.change(input, { target: { files } });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Meu projeto" } });
  fireEvent.change(screen.getByLabelText(/Descrição/), {
    target: { value: "Descrição longa o suficiente para passar na validação." },
  });
  fireEvent.change(screen.getByLabelText(/Link do projeto/), {
    target: { value: "https://example.com/app" },
  });
  fireEvent.change(screen.getByLabelText(/^Tags/), { target: { value: "javascript" } });
}

describe("ProjectFormModal — imagens", () => {
  it("adiciona imagens com pré-visualização e contador", () => {
    const { fileInput } = renderModal();

    pickFiles(fileInput, [makeFile("a.png", "image/png"), makeFile("b.jpg", "image/jpeg")]);

    expect(screen.getByText("2/4")).toBeTruthy();
    expect(screen.getAllByLabelText("Remover imagem")).toHaveLength(2);
    expect(screen.getAllByAltText("Nova imagem seleccionada")).toHaveLength(2);
  });

  it("remove imagens individualmente", () => {
    const { fileInput } = renderModal();
    pickFiles(fileInput, [makeFile("a.png", "image/png"), makeFile("b.jpg", "image/jpeg")]);

    fireEvent.click(screen.getAllByLabelText("Remover imagem")[0]);

    expect(screen.getByText("1/4")).toBeTruthy();
    expect(screen.getAllByLabelText("Remover imagem")).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("mostra erro claro para formato inválido e não acrescenta", () => {
    const { fileInput } = renderModal();

    pickFiles(fileInput, [makeFile("anim.gif", "image/gif")]);

    expect(screen.getByText(/Formato não suportado/)).toBeTruthy();
    expect(screen.queryAllByLabelText("Remover imagem")).toHaveLength(0);
    expect(screen.queryByText("0/4")).toBeNull();
  });

  it("mostra erro claro para ficheiro acima de 5 MB", () => {
    const { fileInput } = renderModal();
    const big = makeFile("big.png", "image/png");
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });

    pickFiles(fileInput, [big]);

    expect(screen.getByText(/excede o limite de 5 MB/)).toBeTruthy();
  });

  it("respeita o limite de 4 imagens mesmo com selecção múltipla", () => {
    const project = {
      title: "Projeto",
      description: "Descrição válida o suficiente.",
      projectUrl: "https://example.com",
      githubUrl: "",
      tags: [],
      imagePaths: [PATH_A, PATH_B, PATH_C],
    };
    const { fileInput } = renderModal({ project });

    pickFiles(fileInput, [makeFile("d.png", "image/png"), makeFile("e.png", "image/png")]);

    expect(screen.getByText("Limite de 4 imagens atingido.")).toBeTruthy();
    expect(screen.getByText(/Só podes anexar até 4 imagens/)).toBeTruthy();
    expect(screen.getAllByLabelText("Remover imagem")).toHaveLength(4);
    expect(screen.queryByLabelText("Adicionar imagem")).toBeNull();
  });

  it("mostra as imagens existentes em edição e permite removê-las", () => {
    const project = {
      title: "Projeto",
      description: "Descrição válida o suficiente.",
      projectUrl: "https://example.com",
      githubUrl: "",
      tags: [],
      imagePaths: [PATH_A, PATH_B],
    };
    const { fileInput } = renderModal({ project });

    expect(screen.getAllByAltText("Imagem existente")).toHaveLength(2);
    expect(screen.getByText("2/4")).toBeTruthy();

    fireEvent.click(screen.getAllByLabelText("Remover imagem")[0]);
    expect(screen.getByText("1/4")).toBeTruthy();

    pickFiles(fileInput, [makeFile("nova.png", "image/png")]);
    expect(screen.getByText("2/4")).toBeTruthy();
  });

  it("envia no payload os ficheiros novos e os paths mantidos", () => {
    const { fileInput, onSave } = renderModal();
    fillValidForm();
    pickFiles(fileInput, [makeFile("a.png", "image/png")]);

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [payload] = onSave.mock.calls[0];
    expect(payload.title).toBe("Meu projeto");
    expect(payload.images).toHaveLength(1);
    expect(payload.imagePaths).toEqual([]);
  });

  it("impede submissão duplicada enquanto está a submeter", () => {
    const { onSave } = renderModal({ submitting: true });
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(onSave).not.toHaveBeenCalled();
  });
});
