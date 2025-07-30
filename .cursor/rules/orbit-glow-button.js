document.querySelectorAll('.segment').forEach(segment => {
        segment.addEventListener('click', function(e) {
            // Check if this segment is already active
            const isActive = this.classList.contains('active');
            
            // Remove active class from all segments
            document.querySelectorAll('.segment').forEach(s => {
                s.classList.remove('active');
            });
            
            // If this segment wasn't active before, make it active
            if (!isActive) {
                this.classList.add('active');
                
                // Get the parent segmented-glow-button and add hide-orbit class
                const parentButton = this.closest('.segmented-glow-button');
                if (parentButton) {
                    parentButton.classList.add('hide-orbit');
                }
            } else {
                // If segment was deactivated, remove hide-orbit class
                const parentButton = this.closest('.segmented-glow-button');
                if (parentButton) {
                    parentButton.classList.remove('hide-orbit');
                }
            }
            
            // Prevent default button behavior
            e.preventDefault();
        });
    });
