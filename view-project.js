document.addEventListener('DOMContentLoaded', async function () {
    await db.init();
    
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id'));
    
    // Navigation functionality
    const navButtons = document.querySelectorAll('.project-nav button');
    const sections = document.querySelectorAll('.project-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' class from all sections and buttons
            sections.forEach(section => section.classList.remove('active'));
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add 'active' class to clicked button and corresponding section
            button.classList.add('active');
            const sectionId = button.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
            }
        });
    });
    
    try {
        const project = await db.getProject(projectId);
        if (!project) {
            console.error('Project not found');
            alert('Project not found');
            window.location.href = 'index.html';
            return;
        }

        // Set banner image
        const bannerImage = document.getElementById('bannerImage');
        if (project.banner) {
            bannerImage.src = project.banner;
        } else {
            bannerImage.classList.add('default-banner');
        }

        // Populate project details
        document.getElementById('projectTitle').textContent = project.title;
        document.getElementById('projectDescription').textContent = project.description;
        document.getElementById('projectDueDate').textContent = project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A';
        document.getElementById('learned').textContent = project.question1 || 'N/A';
        document.getElementById('surprised').textContent = project.question2 || 'N/A';

        // Populate gallery
        const galleryPreview = document.getElementById('galleryPreview');
        if (project.files && project.files.length > 0) {
            project.files.forEach(file => {
                const img = document.createElement('img');
                img.src = file;
                galleryPreview.appendChild(img);
            });
        }

        // Populate links
        const linksList = document.getElementById('linksList');
        if (project.links && project.links.length > 0) {
            project.links.forEach(link => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = link;
                a.textContent = link;
                a.target = '_blank';
                li.appendChild(a);
                linksList.appendChild(li);
            });
        }

        // Button handlers
        const editButton = document.getElementById('editProjectButton');
        const backButton = document.getElementById('backButton');
        const deleteButton = document.getElementById('deleteProjectButton');
        const submitButton = document.getElementById('submitProjectButton');

        editButton.addEventListener('click', () => {
            window.location.href = `edit-project.html?id=${project.id}`;
        });

        backButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this project?')) {
                await db.deleteProject(project.id);
                window.location.href = 'index.html';
            }
        });

        submitButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to submit this project? You won\'t be able to edit it after submission.')) {
                project.status = 'submitted';
                await db.updateProject(project);
                editButton.style.display = 'none';
                submitButton.style.display = 'none';
                window.location.href = 'index.html';
            }
        });

        // Hide edit and submit buttons if project is submitted
        if (project.status === 'submitted') {
            editButton.style.display = 'none';
            submitButton.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error loading project details');
    }
});
  