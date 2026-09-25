import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { ClassificationResult } from '../llm/llm.service';

const TTL_SECONDS = 60 * 60 * 24; 

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
  }

  async getClassification(
    subject: string,
    message: string,
    organizationId: string,
  ): Promise<ClassificationResult | null> {
    const key = this.buildKey(subject, message, organizationId);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as ClassificationResult;
    } catch {
      return null; 
    }
  }

  async setClassification(
    subject: string,
    message: string,
    organizationId: string,
    result: ClassificationResult,
  ): Promise<void> {
    const key = this.buildKey(subject, message, organizationId);
    await this.redis.set(key, JSON.stringify(result), 'EX', TTL_SECONDS);
  }

  private buildKey(subject: string, message: string, organizationId: string): string {
    const normalized = `${subject}\n${message}`
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    const hash = createHash('sha256').update(normalized).digest('hex');
    return `cache:${organizationId}:${hash}`;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}