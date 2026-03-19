
    window.addEventListener('load', function() {
        window.scrollTo(0, 0);
    });


    
    window.addEventListener('load', function() {
      setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
          mainContent.style.display = 'block';
        }, 500); // wait for fade-out transition
      }, 5000); // 5 seconds loading
    });