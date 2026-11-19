import app, { info } from './app.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Remso Media server running on http://localhost:${PORT}`);
  if (!info.ADMIN_PASSWORD_SET) console.log('⚠  Using the default admin password. Set the ADMIN_PASSWORD env var before going live.');
});
