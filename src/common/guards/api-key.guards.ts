import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationService } from '../../organization/organization.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly organizations: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    request.organization = await this.organizations.validateApiKey(apiKey);
    return true;
  }
}