import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseUrl = withNeonIpv4Fallback(process.env.DATABASE_URL);
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function withNeonIpv4Fallback(rawUrl?: string) {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (url.hostname !== "ep-empty-haze-azhxvveb-pooler.c-3.ap-southeast-1.aws.neon.tech") {
      return rawUrl;
    }

    url.hostname = "52.76.128.157";
    url.searchParams.delete("channel_binding");
    url.searchParams.set("options", "endpoint=ep-empty-haze-azhxvveb-pooler");

    return url.toString();
  } catch {
    return rawUrl;
  }
}
