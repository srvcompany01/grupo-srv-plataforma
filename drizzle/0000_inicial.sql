CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"token" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "midias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"versao_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"tipo" text NOT NULL,
	"chave_r2" text NOT NULL,
	"nome_original" text NOT NULL,
	"tamanho_bytes" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"data_prevista" date NOT NULL,
	"formato" text NOT NULL,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respostas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"versao_id" uuid NOT NULL,
	"decisao" text NOT NULL,
	"comentario" text DEFAULT '' NOT NULL,
	"nome_respondente" text NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "versoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"ideia" text DEFAULT '' NOT NULL,
	"objetivo" text DEFAULT '' NOT NULL,
	"legenda" text DEFAULT '' NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "midias" ADD CONSTRAINT "midias_versao_id_versoes_id_fk" FOREIGN KEY ("versao_id") REFERENCES "public"."versoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_versao_id_versoes_id_fk" FOREIGN KEY ("versao_id") REFERENCES "public"."versoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versoes" ADD CONSTRAINT "versoes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_token_idx" ON "clientes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "midias_versao_idx" ON "midias" USING btree ("versao_id");--> statement-breakpoint
CREATE INDEX "posts_cliente_idx" ON "posts" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "respostas_versao_idx" ON "respostas" USING btree ("versao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "versoes_post_numero_idx" ON "versoes" USING btree ("post_id","numero");