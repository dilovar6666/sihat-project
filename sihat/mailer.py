import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from urllib.parse import urlencode

from sihat.config import Settings


class MailDeliveryError(RuntimeError):
    """Raised when a configured mail provider cannot deliver a reset email."""


def send_password_reset_email(recipient: str, token: str, settings: Settings) -> None:
    if not settings.smtp_is_configured or settings.smtp_password is None:
        raise MailDeliveryError("Email delivery is not configured")

    separator = "&" if "?" in settings.password_reset_url else "?"
    reset_url = f"{settings.password_reset_url}{separator}{urlencode({'token': token})}"
    message = EmailMessage()
    message["Subject"] = "Сброс пароля SIHAT / SIHAT password reset"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient

    # Plain text version
    message.set_content(
        "Здравствуйте!\n\n"
        "Был получен запрос на сброс пароля для вашей учётной записи SIHAT.\n\n"
        f"Для установки нового пароля перейдите по ссылке:\n{reset_url}\n\n"
        "Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.\n\n"
        "---\n"
        "SIHAT — цифровая система клинического скрининга\n"
        "https://sihat.king.tj\n"
    )

    year = datetime.now().year
    # Rich HTML version
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сброс пароля SIHAT</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <tr>
      <td style="background: linear-gradient(135deg, #103D35 0%, #17A884 100%); padding: 36px 30px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">🌿 SIHAT</h1>
        <div style="color: #d1fae5; font-size: 13px; margin-top: 6px; font-weight: 500;">Клинический скрининг и превентивное здоровье</div>
      </td>
    </tr>
    <tr>
      <td style="padding: 36px 32px;">
        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">Здравствуйте!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Был получен запрос на сброс пароля для вашей учётной записи в системе <strong>SIHAT</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Чтобы установить новый пароль, нажмите кнопку ниже:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{reset_url}" style="background: linear-gradient(135deg, #103D35 0%, #17A884 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(23,168,132,0.35);">
            Сбросить пароль
          </a>
        </div>
        <p style="font-size: 12px; line-height: 1.6; color: #64748b;">
          Если кнопка не отображается, скопируйте ссылку и откройте её в браузере:<br>
          <a href="{reset_url}" style="color: #17A884; word-break: break-all;">{reset_url}</a>
        </p>
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 1.5; color: #94a3b8;">
          ⏱️ Ссылка действительна в течение <strong>1 часа</strong>.<br>
          Если вы не отправляли данный запрос, просто проигнорируйте письмо — ваш пароль останется без изменений.
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        © {year} SIHAT • Интеллектуальный скрининг сенсорных и когнитивных функций
      </td>
    </tr>
  </table>
</body>
</html>"""
    message.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls(context=ssl.create_default_context())
            server.login(settings.smtp_username, settings.smtp_password.get_secret_value())
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise MailDeliveryError("Password reset email could not be delivered") from exc
