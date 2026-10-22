import smtplib
import ssl
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
    message["Subject"] = "SIHAT password reset"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        "A password reset was requested for your SIHAT account.\n\n"
        f"Open this link to set a new password: {reset_url}\n\n"
        "The link expires in one hour. If you did not request it, you can ignore this email."
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls(context=ssl.create_default_context())
            server.login(settings.smtp_username, settings.smtp_password.get_secret_value())
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise MailDeliveryError("Password reset email could not be delivered") from exc
