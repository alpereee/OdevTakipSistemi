# Ödev Takip Sistemi

Bu proje, öğrencilerin ödev süreçlerini yönetmek, öğretmenlerin ödev verip değerlendirmesini sağlamak ve velilerin bu süreci takip edebilmesi için geliştirilmiş kapsamlı bir **Full-Stack (Node.js + React)** uygulamasıdır.

## 🚀 Kullanılan Teknolojiler

- **Frontend:** React, Vite, Axios, Recharts, Lucide-React
- **Backend:** Node.js, Express, SQLite3, Bcrypt, JWT (JSON Web Token), Multer
- **Tasarım Dili:** Tamamen Tailwind'siz saf CSS ile oluşturulmuş **Glassmorphism** (Cam Efekti) arayüz.

## 📦 Kurulum ve Çalıştırma

Proje `frontend` ve `backend` olmak üzere iki ana dizinden oluşmaktadır.

### 1. Backend (Arka Uç) Kurulumu
1. Terminalde `backend` dizinine gidin:
   ```bash
   cd backend
   ```
2. Gerekli paketleri kurun:
   ```bash
   npm install
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   *Sunucu `http://localhost:5000` portunda çalışacaktır. İlk çalıştırmada `database.sqlite` dosyası otomatik olarak oluşturulur ve test verileri eklenir.*

### 2. Frontend (Ön Yüz) Kurulumu
1. Terminalde ana dizinden `frontend` dizinine gidin:
   ```bash
   cd frontend
   ```
2. Gerekli paketleri kurun:
   ```bash
   npm install
   ```
3. React (Vite) sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   *Uygulama `http://localhost:5173` adresinde yayına girecektir.*

## 🔑 Test Hesapları

Sistem ayağa kalktığında aşağıdaki örnek hesaplar veritabanına otomatik olarak tanımlanır. Tüm hesapların standart şifresi **`123`**'tür.

- **Yönetici (Admin):** `admin`
- **Öğretmen:** `ogretmen_ali`
- **Öğrenci:** `ogrenci_ayse`
- **Veli:** `veli_ahmet`

## 🌍 Projeyi Başka Bir Bilgisayarda / Telefondan Çalıştırma (Ngrok)

Eğer projeyi aynı ağda olmayan, uzaktaki bir bilgisayardan veya telefondan test etmek isterseniz (Örneğin öğretmenin telefonundan giriş yapmasını test etmek için) `ngrok` kullanabilirsiniz.

1. Ngrok uygulamasını bilgisayarınıza indirin ve kurun.
2. Öncelikle yerel makinenizde Frontend'i (`npm run dev`) başlatın (genellikle 5173 portu).
3. Yeni bir terminal açın ve aşağıdaki komutu çalıştırın:
   ```bash
   ngrok http 5173
   ```
4. Ngrok size `https://ab12-34-56...ngrok-free.app` formatında bir yönlendirme adresi verecektir. Bu adresi kullanarak dünyanın herhangi bir yerindeki cihazdan sisteme giriş yapabilirsiniz!
*(Not: Backend API çağrılarının tam kapasite çalışabilmesi için `axios` isteklerindeki `localhost:5000` kısımlarının IP adresi veya backend'in ngrok adresiyle güncellenmesi gerekebilir).*

## ✨ Temel Özellikler

*   **Role Based Auth:** 4 farklı kullanıcı rolü ve her role özel JWT korumalı REST API.
*   **Okul ve Devamsızlık Yönetimi:** Okul eklenebilir ve öğrencilerin devamsızlık durumları takip edilebilir.
*   **Analitik ve Grafikler:** Öğretmenler için ödev yükünü hesaplayan analitik servis ve Recharts ile görselleştirilmiş haftalık yük grafiği.
*   **Değerlendirme Sistemi:** Öğretmenlerin teslim edilen ödevlere not (0-100) verip metin bazlı geri bildirim yazabilmesi. Veli panelinde bu notların okunabilmesi.
*   **Mesajlaşma & Duyurular:** Öğretmen-Öğrenci arası dahili mesajlaşma. Adminlerin genel duyuru yayınlayabilmesi.
*   **Dosya Yükleme:** `multer` ile ödev ataması sırasında dosya yüklenebilmesi.

## 📄 Lisans
Bu proje açık kaynaklı bir iskelet (boilerplate) projedir. İstenildiği gibi geliştirilebilir.
