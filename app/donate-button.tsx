'use client';

import { Copy, Heart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Cập nhật ba dòng dưới đây khi có thông tin nhận donate chính thức.
const BANK_NAME = 'TPBank';
const ACCOUNT_NAME = 'PHAM PHUONG TRUONG';
const ACCOUNT_NUMBER = '04046889001'; // giữ dạng chuỗi để không mất số 0 đầu

export default function DonateButton() {
  const [open, setOpen] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  const copyAccount = async () => {
    if (ACCOUNT_NUMBER.startsWith('Chưa')) return;
    await navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <button className="donate-button" onClick={() => setOpen(true)} aria-label="Ủng hộ website">
        <Heart size={17} />
        <span>Donate</span>
      </button>

      {open && (
        <div
          className="donate-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="donate-card" role="dialog" aria-modal="true" aria-label="Thông tin donate">
            <button className="donate-close" onClick={() => setOpen(false)} aria-label="Đóng">
              <X size={20} />
            </button>
            <span className="donate-eyebrow">ỦNG HỘ THƯ VIỆN ONMYOJI</span>
            <h2>Cảm ơn bạn!</h2>
            <p className="donate-intro">
              Xin chào các bạn, mình là TomNook. <br />
			  Sự ủng hộ của bạn giúp duy trì và cập nhật dữ liệu cho website. <br />
			  Mọi góp ý có thể liên đến discord #yoha555
            </p>
            <div className="donate-content">
              <div className={`donate-qr ${qrLoaded ? 'loaded' : ''}`}>
                <span>
                  Ảnh QR sẽ được cập nhật tại
                  <br />
                  <b>public/donate/qr.webp</b>
                </span>
                <img
                  src="/donate/qr.webp"
                  alt="Mã QR donate"
                  onLoad={() => setQrLoaded(true)}
                  onError={() => setQrLoaded(false)}
                />
              </div>
              <dl className="donate-bank">
                <div>
                  <dt>Ngân hàng</dt>
                  <dd>{BANK_NAME}</dd>
                </div>
                <div>
                  <dt>Chủ tài khoản</dt>
                  <dd>{ACCOUNT_NAME}</dd>
                </div>
                <div>
                  <dt>Số tài khoản</dt>
                  <dd>
                    {ACCOUNT_NUMBER}
                    <button onClick={copyAccount} aria-label="Sao chép số tài khoản">
                      <Copy size={16} />
                    </button>
                  </dd>
                </div>
                {copied && <small>Đã sao chép số tài khoản</small>}
              </dl>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
