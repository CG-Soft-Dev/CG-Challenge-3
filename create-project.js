document.addEventListener('DOMContentLoaded', async function() {
    // Initializes database
    await db.init();

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

    // Handles banner preview
    const bannerInput = document.getElementById('banner');
    const bannerPreview = document.getElementById('bannerImage');

    bannerInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                bannerPreview.src = e.target.result;
                bannerPreview.style.display = 'block';
                bannerPreview.classList.remove('default-banner');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Handles gallery files
    const filesInput = document.getElementById('files');
    const galleryPreview = document.getElementById('galleryPreview');


    filesInput.addEventListener('change', async () => {
        try {
            const maxFiles = 10; // Limits number of files
            if (filesInput.files.length > maxFiles) {
                alert(`Please select no more than ${maxFiles} files.`);
                filesInput.value = '';
                return;
            }
    
            for (const file of filesInput.files) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit per file
                    alert(`File ${file.name} is too large. Please select files under 5MB.`);
                    continue;
                }
                console.log('Processing file:', file.name);
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

    // Handles links
    const linksInput = document.getElementById('links');
    const linksList = document.getElementById('linksList');

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

    // Updates form submission to use IndexedDB
    document.getElementById('createProjectForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submission started');

        try {
            // Compresses banner image
            let bannerData = '';
            if (bannerInput.files[0]) {
                console.log('Compressing banner image...');
                bannerData = await compressImage(bannerInput.files[0]);
            }

            // Compress gallery images
            console.log('Processing gallery images...');
            const galleryFiles = [];
            for (const img of galleryPreview.children) {
                try {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    const compressedData = await compressImage(blob);
                    galleryFiles.push(compressedData);
                } catch (error) {
                    console.error('Error processing gallery image:', error);
                    // Continue with other images if one fails
                }
            }

            const links = Array.from(linksList.children).map(li => li.textContent);

            const newProject = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                dueDate: document.getElementById('dueDate').value,
                banner: bannerData,
                question1: document.getElementById('question1').value,
                question2: document.getElementById('question2').value,
                files: galleryFiles,
                links: links,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            console.log('Adding project to database...');
            await db.addProject(newProject);
            console.log('Project added successfully');
            window.location.replace('index.html');
        } catch (error) {
            console.error('Error creating project:', error);
            alert('An error occurred while creating the project. Please try again.');
        }
    });

    // Handles cancel button
    document.getElementById('cancelCreate').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
            window.location.href = 'index.html';
        }
    });
});