CREATE TABLE "AuthAccount" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuthSession" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "AuthSession_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "AuthUser" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AuthUser_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "AuthVerification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "authUserId" text;--> statement-breakpoint
ALTER TABLE "AuthAccount" ADD CONSTRAINT "AuthAccount_userId_AuthUser_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."AuthUser"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_AuthUser_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."AuthUser"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuthVerification_identifier_idx" ON "AuthVerification" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_authUserId_key" UNIQUE("authUserId");