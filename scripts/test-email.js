const nodemailer = require('nodemailer');

async function testEmailConfig() {
  try {
    console.log('Testing email configuration...');
    
    // Check required environment variables
    const requiredVars = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_HOST', 'EMAIL_PORT'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing.join(', '));
      return;
    }

    const config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };

    console.log('Creating transporter with config:', {
      ...config,
      auth: {
        user: config.auth.user,
        pass: '****'
      }
    });

    const transporter = nodemailer.createTransport(config);

    console.log('Verifying transporter configuration...');
    await transporter.verify();
    console.log('Email configuration is valid! ✓');
    
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}

testEmailConfig();