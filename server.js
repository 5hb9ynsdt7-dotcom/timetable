const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 所有路由都返回index.html（单页应用）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`课程管理系统运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
