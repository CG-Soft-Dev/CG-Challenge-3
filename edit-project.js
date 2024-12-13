document.addEventListener('DOMContentLoaded', async function() {
    await db.init();

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id'));

    // Navigation functionality
    const navButtons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('.project-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.section).classList.add('active');
        });
    });

    // Loads existing project data
    try {
        const project = await db.getProject(projectId);
        if (!project) {
            alert('Project not found');
            window.location.href = 'index.html';
            return;
        }

        // Populates form fields
        document.getElementById('title').value = project.title || '';
        document.getElementById('description').value = project.description || '';
        document.getElementById('dueDate').value = project.dueDate || '';
        document.getElementById('question1').value = project.question1 || '';
        document.getElementById('question2').value = project.question2 || '';

        // Sets banner preview
        const bannerImage = document.getElementById('bannerImage');
        if (project.banner) {
            bannerImage.src = project.banner;
            bannerImage.classList.remove('default-banner');
        }

        // Populates gallery
        const galleryPreview = document.getElementById('galleryPreview');
        if (project.files) {
            project.files.forEach(file => {
                const img = document.createElement('img');
                img.src = file;
                galleryPreview.appendChild(img);
            });
        }

        // Populates links
        const linksList = document.getElementById('linksList');
        if (project.links) {
            project.links.forEach(link => {
                const li = document.createElement('li');
                li.textContent = link;
                linksList.appendChild(li);
            });
        }

        // Handles banner changes
        const bannerInput = document.getElementById('banner');
        bannerInput.addEventListener('change', async function(e) {
            if (this.files && this.files[0]) {
                try {
                    const compressedData = await compressImage(this.files[0]);
                    bannerImage.src = compressedData;
                    bannerImage.classList.remove('default-banner');
                } catch (error) {
                    console.error('Error compressing banner image:', error);
                    alert('Error processing banner image. Please try again.');
                }
            }
        });


        // Handles gallery file additions
        const filesInput = document.getElementById('files');
        filesInput.addEventListener('change', async () => {
            try {
                const maxFiles = 10; // Limits number of files
                if (filesInput.files.length > maxFiles) {
                    alert(`Please select no more than ${maxFiles} files.`);
                    filesInput.value = '';
                    return;
                }

                for (const file of filesInput.files) {
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit per file, for the purposes of this project
                        alert(`File ${file.name} is too large. Please select files under 5MB.`);
                        continue;
                    }
                    const compressedData = await compressImage(file);
                    const img = document.createElement('img');
                    img.src = compressedData;
                    galleryPreview.appendChild(img);
                }
            } catch (error) {
                console.error('Error processing files:', error);
                alert('Error processing one or more files. Please try again.');
            }
        });

        // Handles link additions
        const linksInput = document.getElementById('links');
        linksInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const link = linksInput.value.trim();
                if (link) {
                    const li = document.createElement('li');
                    li.textContent = link;
                    linksList.appendChild(li);
                    linksInput.value = '';
                }
            }
        });

        // Handles form submission
        document.getElementById('editProjectForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            try {
                // Compresses banner if it's changed
                let bannerData = project.banner;
                if (bannerImage.src !== project.banner) {
                    const response = await fetch(bannerImage.src);
                    const blob = await response.blob();
                    bannerData = await compressImage(blob);
                }
        
                // Compresses gallery images
                const galleryFiles = [];
                for (const img of galleryPreview.children) {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    const compressedData = await compressImage(blob);
                    galleryFiles.push(compressedData);
                }
        
                const updatedProject = {
                    ...project,
                    title: document.getElementById('title').value,
                    description: document.getElementById('description').value,
                    dueDate: document.getElementById('dueDate').value,
                    question1: document.getElementById('question1').value,
                    question2: document.getElementById('question2').value,
                    banner: bannerData,
                    files: galleryFiles,
                    links: Array.from(linksList.children).map(li => li.textContent)
                };
        
                await db.updateProject(updatedProject);
                window.location.href = `view-project.html?id=${projectId}`;
            } catch (error) {
                console.error('Error updating project:', error);
                alert('Error saving changes');
            }

        });

        // Handles cancel button
        document.getElementById('cancelEdit').addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
                window.location.href = `view-project.html?id=${projectId}`;
            }
        });

    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error loading project details');
    }

    async function compressImage(file, maxWidth = 1080, quality = 0.7) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function(e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = function() {
                        try {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;

                            if (width > maxWidth) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            const compressedData = canvas.toDataURL('image/jpeg', quality);
                            const sizeInMB = (compressedData.length * 0.75) / (1024 * 1024);
                            
                            if (sizeInMB > 5) {
                                // If still too large, compress more
                                return resolve(compressImage(file, maxWidth, quality - 0.1));
                            }
                            
                            resolve(compressedData);
                        } catch (error) {
                            reject(error);
                        }
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
            } catch (error) {
                reject(error);
            }
        });
    }
});