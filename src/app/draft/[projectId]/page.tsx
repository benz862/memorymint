import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import DraftEditor from "./DraftEditor";
import styles from "../../create/page.module.css";

export default async function DraftPage({ params }: { params: { projectId: string } }) {
  const { projectId } = await params;

  const project = await prisma.cardProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Review Your Message</h1>
        <p className={styles.subtitle}>
          Here is what we crafted together. You can tweak it slightly if you want it to be perfect.
        </p>
      </header>
      
      <main className={styles.wizard}>
        <DraftEditor 
          projectId={project.id} 
          initialText={project.edited_text || project.generated_text || ""}
          initialRecipientName={project.recipient_name}
          initialSenderName={project.sender_name}
        />
      </main>
    </div>
  );
}
