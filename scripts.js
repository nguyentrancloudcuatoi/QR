// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.querySelector('.btn-login');
const registerBtn = document.querySelector('.btn-register');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const startCameraBtn = document.getElementById('startCamera');
const stopCameraBtn = document.getElementById('stopCamera');
const webcamElement = document.getElementById('webcam');
const lessonContent = document.getElementById('lessonContent');

// Navigation highlight
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section');

// QR Scanner variables
let scanner = null;
let videoStream = null;

// Lấy các elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startCamera');
const stopButton = document.getElementById('stopCamera');

// Modal functions
function openModal() {
    loginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    loginModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event Listeners
loginBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        closeModal();
    }
});

// Form handling
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add login logic here
    console.log('Login submitted');
    closeModal();
});

// Scroll spy for navigation
function updateActiveNavLink() {
    let fromTop = window.scrollY + 100;

    sections.forEach(section => {
        const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
        if (!link) return;

        if (
            section.offsetTop <= fromTop &&
            section.offsetTop + section.offsetHeight > fromTop
        ) {
            navLinks.forEach(link => link.classList.remove('active'));
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);
window.addEventListener('load', updateActiveNavLink);

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// QR Scanner functions
async function startScanner() {
    try {
        // Yêu cầu quyền truy cập camera
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        // Gán video stream vào element
        video.srcObject = videoStream;
        await video.play();

        // Cập nhật trạng thái nút
        startButton.disabled = true;
        stopButton.disabled = false;

        // Bắt đầu quét
        scanQRCode();
    } catch (err) {
        console.error('Lỗi truy cập camera:', err);
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
}

function stopScanner() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

function scanQRCode() {
    if (!videoStream) return;

    // Kiểm tra video đã sẵn sàng
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Thiết lập canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Vẽ frame hiện tại vào canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Lấy dữ liệu hình ảnh
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
            // Quét QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                // Nếu tìm thấy QR code
                console.log('Đã tìm thấy QR code:', code.data);
                handleQRCode(code.data);
                stopScanner();
                return;
            }
        } catch (error) {
            console.error('Lỗi khi quét QR:', error);
        }
    }

    // Tiếp tục quét nếu chưa tìm thấy QR code
    requestAnimationFrame(scanQRCode);
}

function handleQRCode(data) {
    try {
        console.log('QR Data received:', data);
        const content = JSON.parse(data);
        console.log('Parsed content:', content);
        showContent(content);
    } catch (e) {
        console.error('Lỗi parse dữ liệu QR:', e);
        alert('Mã QR không hợp lệ! Vui lòng thử lại.');
    }
}

function getEmbedUrl(url) {
    try {
        // Xử lý URL Google Slides
        const presentationId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (presentationId && presentationId[1]) {
            return `https://docs.google.com/presentation/d/${presentationId[1]}/embed?start=false&loop=false&delayms=3000`;
        }
        return url;
    } catch (error) {
        console.error('Lỗi chuyển đổi URL:', error);
        return url;
    }
}

function showContent(content) {
    const contentPreview = document.getElementById('content-preview');
    if (!contentPreview) {
        console.error('Không tìm thấy element content-preview');
        return;
    }

    console.log('Showing content:', content);

    switch (content.type) {
        case 'slides':
            const embedUrl = getEmbedUrl(content.url);
            console.log('Embed URL:', embedUrl);
            contentPreview.innerHTML = `
                <div class="slides-container">
                    <iframe 
                        src="${embedUrl}"
                        frameborder="0"
                        width="100%"
                        height="100%"
                        allowfullscreen="true"
                        mozallowfullscreen="true"
                        webkitallowfullscreen="true">
                    </iframe>
                </div>`;
            break;

        case 'youtube':
            contentPreview.innerHTML = `
                <div class="video-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${content.videoId}?autoplay=1" 
                        frameborder="0"
                        width="100%"
                        height="100%"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
                        allowfullscreen>
                    </iframe>
                </div>`;
            break;

        default:
            contentPreview.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Định dạng không được hỗ trợ</p>
                </div>`;
    }
}

// Event Listeners
startCameraBtn.addEventListener('click', startScanner);
stopCameraBtn.addEventListener('click', stopScanner);
closeMediaBtn.addEventListener('click', () => {
    mediaContent.style.display = 'none';
    mediaPlayer.innerHTML = '';
    console.log(webcamElement);

});
// Mẫu QR code data:    
/*
{
    "type": "youtube",
    "videoId": "dQw4w9WgXcQ"
}
hoặc
{
    "type": "slides",
    "url": "https://docs.google.com/presentation/d/1HXh5NYX8vDo-j-2XsvJLyx_7gDTy10Ll/edit?usp=sharing&ouid=114140178868357915544&rtpof=true&sd=true"
}
hoặc
{
    "type": "pdf",
    "url": "path/to/document.pdf"
}
*/

// Animation for feature cards
const observerOptions = {
    threshold: 0.2
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .resource-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    observer.observe(card);
});

// Resource download handling
document.querySelectorAll('.btn-download').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const resourceName = this.closest('.resource-card').querySelector('h3').textContent;
        alert(`Đang tải xuống tài liệu: ${resourceName}`);
        // Add actual download logic here
    });
});

// Mobile menu handling (you might want to add a hamburger menu for mobile)
function createMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    mobileMenuBtn.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('show');
    });
    
    navbar.insertBefore(mobileMenuBtn, navbar.firstChild);
}

// Call mobile menu setup on load
if (window.innerWidth <= 768) {
    createMobileMenu();
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.mobile-menu-btn')) {
            createMobileMenu();
        }
    } else {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.remove();
        }
        document.querySelector('.nav-links').classList.remove('show');
    }
});
