# Cognitive Chatbot System - Operational Steps

يحتوي هذا المشروع على ثلاثة أجزاء رئيسية: الخادم (Backend)، واجهة المستخدم (Frontend)، ولوحة تحكم المسؤول (Admin Panel).

## متطلبات التشغيل

- Node.js (v16 أو أحدث)
- MongoDB (تم إعداده في ملف البيئة)

## إعداد البيئة (Environment Setup)

قبل التشغيل، تأكد من وجود ملف `backend/.env` يحتوي على التالي:
```env
PORT=5000
MONGO_URI=mongodb+srv://Ahmad:266216@cluster0.zydwbtv.mongodb.net/Chat_bot?retryWrites=true&w=majority
```

## خطوات التشغيل (Operational Steps)

قم بفتح 3 نوافذ طرفية (Terminals) منفصلة لتشغيل كل جزء على حدة:

### 1. تشغيل الخادم (Backend)

```bash
cd backend
npm install
npm start
```
*سيعمل الخادم على المنفذ: 5000*

### 2. تشغيل لوحة التحكم (Admin Panel)

```bash
cd admin-panel
npm install
npm run dev
```
*ستعمل لوحة التحكم عادةً على المنفذ: 3000*
- افتح المتصفح على: `http://localhost:3000`
- قم بتسجيل الدخول (لا يتطلب كلمة مرور معقدة، فقط اضغط Login).
- قم بإنشاء "Bot" جديد ورفع ملف PDF.
- اضغط على زر "Open Chat" لفتح المحادثة.

### 3. تشغيل واجهة المستخدم (Frontend)

```bash
cd frontend
npm install
npm run dev
```
*ستعمل الواجهة عادةً على المنفذ: 5173*
- عند الدخول لأول مرة، سيُطلب منك إدخال **Gemini API Key** لبدء المحادثة.
