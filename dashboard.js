document.addEventListener('DOMContentLoaded', async function() {
    await db.init();
    
    const projectList = document.getElementById('projectList');
    const submittedProjectList = document.getElementById('submittedProjectList');
    const createNewProjectButton = document.getElementById('createNewProject');

    async function updateDashboard() {
        try {
            const projects = await db.getAllProjects();
            
            // Clear existing lists
            projectList.innerHTML = '';
            submittedProjectList.innerHTML = '';

            // Update analytics
            updateAnalytics(projects);

            // Populate projects
            projects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.className = 'project-item';
                projectItem.innerHTML = `
                    <div class="project-info">
                        <div class="project-text">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                            ${project.dueDate ? `<p><strong>Due Date:</strong> ${new Date(project.dueDate).toLocaleDateString()}</p>` : ''}
                            ${project.status === 'submitted' ? '<p class="status-badge">Submitted</p>' : ''}
                        </div>
                        ${project.banner ? `<img class="project-thumbnail" src="${project.banner}" alt="Project Thumbnail">` : ''}
                    </div>
                `;
                
                projectItem.addEventListener('click', () => {
                    window.location.href = `view-project.html?id=${project.id}`;
                });

                if (project.status === 'submitted') {
                    submittedProjectList.appendChild(projectItem);
                } else {
                    projectList.appendChild(projectItem);
                }
            });
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    function updateAnalytics(projects) {
        const today = new Date();
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(today.getDate() + 7);

        const ongoingCount = projects.filter(project => project.status !== 'submitted').length;
        const submittedCount = projects.filter(project => project.status === 'submitted').length;
        const dueSoonCount = projects.filter(project => {
            if (!project.dueDate || project.status === 'submitted') return false;
            const dueDate = new Date(project.dueDate);
            return dueDate >= today && dueDate <= oneWeekFromNow;
        }).length;

        // Update counters
        document.getElementById('ongoingProjects').textContent = ongoingCount;
        document.getElementById('submittedProjects').textContent = submittedCount;
        document.getElementById('projectsDueSoon').textContent = dueSoonCount;

        const notDueSoonCount = ongoingCount - dueSoonCount;
        const totalProjects = ongoingCount + submittedCount;

        try {
            // Status Distribution Chart
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx) {
                if (window.statusChart instanceof Chart) {
                    window.statusChart.destroy();
                }
                window.statusChart = new Chart(statusCtx, {
                    type: 'pie',
                    data: {
                        labels: ['On-going', 'Submitted'],
                        datasets: [{
                            data: [ongoingCount, submittedCount],
                            backgroundColor: ['#3baea0', '#28a745'],
                           // borderColor: ['#', 'silver'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        layout: {
                            padding: {
                                top: 0,
                                bottom: 15,
                                left: 15,
                                right: 15
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 15,
                                    font: {
                                        size: 11
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const percentage = ((context.raw / totalProjects) * 100).toFixed(1);
                                        return `${context.label}: ${context.raw} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Due Soon Distribution Chart
            const dueSoonCtx = document.getElementById('dueSoonChart');
            if (dueSoonCtx) {
                if (window.dueSoonChart instanceof Chart) {
                    window.dueSoonChart.destroy();
                }
                window.dueSoonChart = new Chart(dueSoonCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Projects Due Within a Week'],
                        datasets: [{
                            data: [dueSoonCount, notDueSoonCount],
                            backgroundColor: ['#ffc107', '#3baea0'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        layout: {
                            padding: {
                                top: 0,
                                bottom: 15,
                                left: 15,
                                right: 15
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 14,
                                    font: {
                                        size: 10
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const percentage = ((context.raw / totalProjects) * 100).toFixed(1);
                                        return `${context.label}: ${context.raw} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error creating charts:', error);
        }
    }

    // Initial dashboard update
    await updateDashboard();

    // Handle "Create New Project" button click
    createNewProjectButton.addEventListener('click', () => {
        window.location.href = 'create-project.html';
    });
});
