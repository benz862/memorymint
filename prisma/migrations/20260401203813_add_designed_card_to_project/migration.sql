-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CardProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "guest_session_id" TEXT,
    "theme_id" TEXT NOT NULL,
    "occasion_subtype_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "relationship_label" TEXT,
    "tone" TEXT NOT NULL,
    "desired_length" TEXT NOT NULL,
    "memories_json" TEXT NOT NULL,
    "qualities_json" TEXT NOT NULL,
    "places_json" TEXT NOT NULL,
    "inside_jokes_json" TEXT,
    "desired_feeling" TEXT NOT NULL,
    "uploaded_image_url" TEXT,
    "generated_text" TEXT,
    "edited_text" TEXT,
    "selected_font_id" TEXT,
    "selected_template_id" TEXT,
    "selected_size" TEXT,
    "designed_card_id" TEXT,
    "inside_photo_url" TEXT,
    "preview_pdf_url" TEXT,
    "final_pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CardProject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CardProject_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "GuestSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CardProject_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "Theme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CardProject_occasion_subtype_id_fkey" FOREIGN KEY ("occasion_subtype_id") REFERENCES "OccasionSubtype" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CardProject_selected_font_id_fkey" FOREIGN KEY ("selected_font_id") REFERENCES "Font" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CardProject_selected_template_id_fkey" FOREIGN KEY ("selected_template_id") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CardProject_designed_card_id_fkey" FOREIGN KEY ("designed_card_id") REFERENCES "DesignedCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CardProject" ("created_at", "desired_feeling", "desired_length", "edited_text", "final_pdf_url", "generated_text", "guest_session_id", "id", "inside_jokes_json", "memories_json", "occasion_subtype_id", "places_json", "preview_pdf_url", "qualities_json", "recipient_name", "relationship_label", "selected_font_id", "selected_size", "selected_template_id", "sender_name", "status", "theme_id", "tone", "updated_at", "uploaded_image_url", "user_id") SELECT "created_at", "desired_feeling", "desired_length", "edited_text", "final_pdf_url", "generated_text", "guest_session_id", "id", "inside_jokes_json", "memories_json", "occasion_subtype_id", "places_json", "preview_pdf_url", "qualities_json", "recipient_name", "relationship_label", "selected_font_id", "selected_size", "selected_template_id", "sender_name", "status", "theme_id", "tone", "updated_at", "uploaded_image_url", "user_id" FROM "CardProject";
DROP TABLE "CardProject";
ALTER TABLE "new_CardProject" RENAME TO "CardProject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
