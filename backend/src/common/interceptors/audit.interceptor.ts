import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // Only audit write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async (data) => {
          if (user) {
            await this.prisma.auditLog.create({
              data: {
                userId: user.id,
                action: `${method} ${url}`,
                entity: this.getEntityName(url),
                entityId: data?.id || body?.id || 'N/A',
                oldData: {},
                newData: body,
                ipAddress: request.ip,
                userAgent: request.get('user-agent'),
              } as any,
            });
          }
        }),
      );
    }

    return next.handle();
  }

  private getEntityName(url: string): string {
    const parts = url.split('/');
    return parts[1] || 'Unknown';
  }
}
