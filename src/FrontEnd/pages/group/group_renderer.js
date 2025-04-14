// 페이지 이동

function goTo(page) {
    window.electronAPI.navigate(page);
}
// 앱 잠금

const activityEvents = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

activityEvents.forEach(event => {
    window.addEventListener(event, () => {
        window.electronAPI.userActive();
    });
});