import os
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

# Initialize S3 client only if we are not in dev mode
if not settings.LOCAL_DEV_MODE:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME,
    )
else:
    s3_client = None

def get_s3_key(tenant_id: int, student_id: int, filename: str) -> str:
    """Generate a tenant-isolated S3 key."""
    safe_name = filename.replace(' ', '_')
    return f"tenants/{tenant_id}/students/{student_id}/{safe_name}"

def upload_file_to_s3(file_bytes: bytes, key: str) -> str:
    """Uploads file bytes to S3 and returns the key."""
    if settings.LOCAL_DEV_MODE:
        path = os.path.join(settings.UPLOAD_DIR, key.replace("/", "_"))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(file_bytes)
        return key

    s3_client.put_object(
        Bucket=settings.AWS_S3_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType="application/pdf"
    )
    return key

def download_file_from_s3(key: str) -> bytes:
    """Downloads file bytes from S3."""
    if settings.LOCAL_DEV_MODE:
        path = os.path.join(settings.UPLOAD_DIR, key.replace("/", "_"))
        with open(path, "rb") as f:
            return f.read()

    response = s3_client.get_object(
        Bucket=settings.AWS_S3_BUCKET_NAME,
        Key=key
    )
    return response['Body'].read()

def delete_file_from_s3(key: str) -> bool:
    """Deletes a file from S3."""
    if settings.LOCAL_DEV_MODE:
        path = os.path.join(settings.UPLOAD_DIR, key.replace("/", "_"))
        if os.path.exists(path):
            os.remove(path)
        return True

    try:
        s3_client.delete_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=key
        )
        return True
    except ClientError:
        return False
