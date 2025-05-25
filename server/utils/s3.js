const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const uploadToS3 = async (fileBuffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `generated/${fileName}`,
    Body: fileBuffer,
    ContentType: 'audio/mpeg',
    ACL: 'public-read'
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // 返回文件的公开访问 URL
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

module.exports = { uploadToS3 }; 