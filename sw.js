// عند تثبيت الحارس في المتصفح
self.addEventListener('install', (event) => {
    console.log('[Service Worker] جاري التثبيت...');
    self.skipWaiting();
});

// عند تفعيل الحارس
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] تم التفعيل وجاهز للعمل في الخلفية!');
});

// الاستماع لرسائل الدفع (Push Notifications) القادمة من السيرفر
self.addEventListener('push', (event) => {
    // محاولة قراءة البيانات الواردة، أو استخدام نص افتراضي
    const data = event.data ? event.data.json() : { title: 'تنبيه النظام', body: 'تحديث جديد من الحساس' };
    
    // إعداد شكل الإشعار
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1284/1284102.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1284/1284102.png',
        dir: 'rtl',
        vibrate: [200, 100, 200] // تشغيل هزاز الجوال
    };

    // إظهار الإشعار على شاشة الجوال
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});