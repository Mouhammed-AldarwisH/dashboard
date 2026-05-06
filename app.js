// 1. إعداد الاتصال بقاعدة البيانات
const supabaseUrl = 'https://arpplnryhoqridtvtvkq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBsbnJ5aG9xcmlkdHZ0dmtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjE4MDIsImV4cCI6MjA5MzUzNzgwMn0.Pi3H4XXrwFa80Xg2hTmjfub1tOQet2o-FK8bccvSU0A';
// تم تغيير اسم المتغير هنا إلى supabaseClient لتجنب التعارض
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. ربط عناصر HTML بالمتغيرات
const statusEl = document.getElementById('sensor-status');
const valTemp = document.getElementById('val-temp');
const valHum = document.getElementById('val-hum');
const valPress = document.getElementById('val-press');
const valGas = document.getElementById('val-gas');
const valTime = document.getElementById('val-time');

// 3. دالة لتحديث واجهة حالة الاتصال
function updateStatusUI(statusText) {
    if (statusText === 'online') {
        statusEl.textContent = 'متصل (Online)';
        statusEl.className = 'status-indicator status-online';
    } else if (statusText === 'offline') {
        statusEl.textContent = 'غير متصل (Offline)';
        statusEl.className = 'status-indicator status-offline';
    } else {
        statusEl.textContent = 'حالة غير معروفة';
        statusEl.className = 'status-indicator';
    }
}

// 4. دالة لتحديث واجهة قراءات الغاز
function updateTelemetryUI(payload, createdAt) {
    if(payload.temperature) valTemp.textContent = payload.temperature;
    if(payload.humidity) valHum.textContent = payload.humidity;
    if(payload.pressure) valPress.textContent = payload.pressure;
    if(payload.Gas_200C) valGas.textContent = payload.Gas_200C;
    
    // تنسيق الوقت
    const date = new Date(createdAt);
    valTime.textContent = date.toLocaleTimeString('ar-SA');
}

// 5. جلب البيانات الأولية عند فتح الصفحة
async function fetchInitialData() {
    // جلب أحدث حالة باستخدام supabaseClient
    const { data: statusData } = await supabaseClient
        .from('sensor_status')
        .select('status')
        .order('id', { ascending: false })
        .limit(1);
        
    if (statusData && statusData.length > 0) {
        updateStatusUI(statusData[0].status);
    }

    // جلب أحدث قراءة للغاز باستخدام supabaseClient
    const { data: telemetryData } = await supabaseClient
        .from('telemetry')
        .select('payload, created_at')
        .order('id', { ascending: false })
        .limit(1);

    if (telemetryData && telemetryData.length > 0) {
        updateTelemetryUI(telemetryData[0].payload, telemetryData[0].created_at);
    }
}

// 6. تشغيل المراقبة اللحظية (Realtime WebSockets)
function subscribeToRealtime() {
    // مراقبة جدول الحالة
    supabaseClient
        .channel('status_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_status' }, payload => {
            console.log('تحديث حالة جديد:', payload.new);
            updateStatusUI(payload.new.status);
        })
        .subscribe();

    // مراقبة جدول الغازات
    supabaseClient
        .channel('telemetry_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemetry' }, payload => {
            console.log('قراءة غاز جديدة:', payload.new);
            updateTelemetryUI(payload.new.payload, payload.new.created_at);
        })
        .subscribe();
}

// تشغيل الدوال عند تحميل الصفحة
fetchInitialData();
subscribeToRealtime();

// 7. تسجيل الـ Service Worker وطلب صلاحية الإشعارات
if ('serviceWorker' in navigator && 'Notification' in window) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('تم تسجيل الـ Service Worker بنجاح.');
            })
            .catch(err => console.error('خطأ في تسجيل Service Worker:', err));
    });

    // طلب إذن المستخدم لإظهار الإشعارات
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('صلاحية الإشعارات ممنوحة.');
        } else {
            console.log('تم رفض صلاحية الإشعارات.');
        }
    });
}