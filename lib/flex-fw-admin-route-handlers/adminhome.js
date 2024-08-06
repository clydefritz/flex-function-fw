const fs = require('fs');
const path = require('path');

exports.adminhome = function adminhome(req, res) {
    const filePath = path.join(__dirname, '../flex-fw-admin-files', 'flex-function-admin.html');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the HTML file:', err);
            res.status(500).send('Server Error: Unable to load the admin page.');
            return;
        }

        // Dynamic variable substitution
        const thisFlexFunctionName       = global.thisFlexFunctionName || 'Default Flex Function';
        const thisFlexFunctionLocation   = global.thisFlexFunctionLocation;
        const thisFlexFunctionStarted    = global.thisFlexFunctionStartTime;
        const thisFlexFunctionStatus     = global.thisFlexFunctionStatus.Status;
        const thisFlexFunctionStatusTime = new Date(global.thisFlexFunctionStatus.Time);

        const adminUserName = 'Flex Admin'; // Example value, replace with dynamic data as needed

        // Replace placeholders in the HTML content
        let content = data
            .replace(/\${thisFlexFunctionName}/g, thisFlexFunctionName)
            .replace(/\${adminUserName}/g, adminUserName)
            .replace(/\${thisFlexFunctionStatus}/g, thisFlexFunctionStatus)
            .replace(/\${thisFlexFunctionLocation}/g, thisFlexFunctionLocation)
            .replace(/\${startupTime}/g, thisFlexFunctionStarted)
            .replace(/\${thisFlexFunctionStatus}/g, thisFlexFunctionStatus)
            .replace(/\${thisFlexFunctionStatusTime}/g, thisFlexFunctionStatusTime);
            
        res.send(content);
    });
};
