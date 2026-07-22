import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Trip SMS alerts (Lyft Healthcare / Concierge style).
 * If Twilio env vars are missing, messages are logged only (safe for local/dev).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private config: ConfigService) {}

  private twilioReady() {
    return Boolean(
      this.config.get('TWILIO_ACCOUNT_SID') &&
        this.config.get('TWILIO_AUTH_TOKEN') &&
        this.config.get('TWILIO_FROM_NUMBER'),
    );
  }

  async sendSms(to: string | null | undefined, body: string) {
    if (!to?.trim()) {
      this.logger.debug(`SMS skipped (no phone): ${body}`);
      return { ok: false, reason: 'no_phone' as const };
    }

    const normalized = to.trim();

    if (!this.twilioReady()) {
      this.logger.log(`[SMS:dev] to=${normalized} | ${body}`);
      return { ok: true, mode: 'log' as const };
    }

    try {
      const sid = this.config.get<string>('TWILIO_ACCOUNT_SID')!;
      const token = this.config.get<string>('TWILIO_AUTH_TOKEN')!;
      const from = this.config.get<string>('TWILIO_FROM_NUMBER')!;
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: normalized, From: from, Body: body }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn(`Twilio failed: ${res.status} ${errText}`);
        return { ok: false, reason: 'twilio_error' as const };
      }

      return { ok: true, mode: 'twilio' as const };
    } catch (err) {
      this.logger.warn(`Twilio exception: ${err}`);
      return { ok: false, reason: 'exception' as const };
    }
  }

  rideRequested(phone: string | null | undefined, pickup: string) {
    return this.sendSms(
      phone,
      `MediRide: Your medical ride was requested. Pickup: ${pickup}. We will text when a driver accepts.`,
    );
  }

  rideAccepted(phone: string | null | undefined, driverName: string) {
    return this.sendSms(
      phone,
      `MediRide: Driver ${driverName} accepted your ride and is on the way. Track live in the MediRide app.`,
    );
  }

  rideArriving(phone: string | null | undefined) {
    return this.sendSms(
      phone,
      `MediRide: Your driver is arriving. Please be ready at the pickup entrance.`,
    );
  }

  rideStarted(phone: string | null | undefined) {
    return this.sendSms(phone, `MediRide: Your trip has started. Safe travels.`);
  }

  rideCompleted(phone: string | null | undefined) {
    return this.sendSms(
      phone,
      `MediRide: Trip completed. Thank you for riding with MediRide.`,
    );
  }
}
