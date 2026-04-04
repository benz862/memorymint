import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import CustomizeForm from "./CustomizeForm";

export default async function CustomizePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const project = await prisma.cardProject.findUnique({
    where: { id: projectId },
  });

  if (!project) notFound();

  const templates = await prisma.template.findMany({ where: { is_active: true } });
  const fonts = await prisma.font.findMany({ where: { is_active: true } });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem 0" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: "0.5rem",
          }}
        >
          Customize Your Card
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "1rem" }}>
          Add a photo, pick a font, and choose your card size. The preview updates live.
        </p>
      </header>

      <CustomizeForm
        projectId={project.id}
        templates={templates}
        fonts={fonts}
        initialSize={project.selected_size || "5x7"}
        initialTemplateId={project.selected_template_id}
        initialFontId={project.selected_font_id}
        initialMessage={project.edited_text || project.generated_text || ""}
        recipientName={project.recipient_name || ""}
        senderName={project.sender_name || ""}
      />
    </div>
  );
}
