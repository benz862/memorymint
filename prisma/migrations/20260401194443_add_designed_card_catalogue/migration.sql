-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_token" TEXT NOT NULL,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OccasionSubtype" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "theme_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OccasionSubtype_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "Theme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "theme_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "size_support_json" TEXT NOT NULL,
    "cover_asset_url" TEXT NOT NULL,
    "inside_left_default_asset_url" TEXT NOT NULL,
    "inside_right_background_asset_url" TEXT NOT NULL,
    "preview_watermark_style" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Template_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "Theme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Font" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "font_family" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "CardProject" (
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
    CONSTRAINT "CardProject_selected_template_id_fkey" FOREIGN KEY ("selected_template_id") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "guest_session_id" TEXT,
    "card_project_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "selected_size" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_provider" TEXT NOT NULL DEFAULT 'stripe',
    "provider_payment_id" TEXT,
    "purchaser_email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "GuestSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_card_project_id_fkey" FOREIGN KEY ("card_project_id") REFERENCES "CardProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "card_project_id" TEXT NOT NULL,
    "download_url" TEXT NOT NULL,
    "expires_at" DATETIME,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" DATETIME,
    CONSTRAINT "Download_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Download_card_project_id_fkey" FOREIGN KEY ("card_project_id") REFERENCES "CardProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignedCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "front_image_url" TEXT NOT NULL,
    "back_image_url" TEXT NOT NULL,
    "preview_thumbnail_url" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DesignedCardOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designed_card_id" TEXT NOT NULL,
    "inside_photo_url" TEXT,
    "inside_photo_caption" TEXT,
    "inside_message" TEXT NOT NULL,
    "selected_size" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_provider" TEXT NOT NULL DEFAULT 'stripe',
    "provider_payment_id" TEXT,
    "purchaser_email" TEXT NOT NULL DEFAULT 'guest@example.com',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "DesignedCardOrder_designed_card_id_fkey" FOREIGN KEY ("designed_card_id") REFERENCES "DesignedCard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GuestSession_session_token_key" ON "GuestSession"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OccasionSubtype_theme_id_slug_key" ON "OccasionSubtype"("theme_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Font_slug_key" ON "Font"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_order_number_key" ON "Order"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_provider_payment_id_key" ON "Order"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "DesignedCard_slug_key" ON "DesignedCard"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DesignedCardOrder_order_number_key" ON "DesignedCardOrder"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "DesignedCardOrder_provider_payment_id_key" ON "DesignedCardOrder"("provider_payment_id");
