const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3();

const uploadToS3 = async (fileBuffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: fileName.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav'
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