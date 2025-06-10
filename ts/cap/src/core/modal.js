export function openGenericModal(title, htmlContent) {
  const genericModal = document.getElementById('genericModal');
  const modalBox = document.getElementById('modalBox');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = title;
  modalContent.innerHTML = htmlContent;
  genericModal.classList.remove('opacity-0', 'pointer-events-none');
  genericModal.classList.add('opacity-100');
  modalBox.classList.remove('scale-95');
  modalBox.classList.add('scale-100');
}

export function closeGenericModal() {
  const genericModal = document.getElementById('genericModal');
  const modalBox = document.getElementById('modalBox');

  modalBox.classList.remove('scale-100');
  modalBox.classList.add('scale-95');
  genericModal.classList.remove('opacity-100');
  genericModal.classList.add('opacity-0');
  setTimeout(() => {
    genericModal.classList.add('pointer-events-none');
  }, 200);
}
