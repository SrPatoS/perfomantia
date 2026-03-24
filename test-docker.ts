import si from 'systeminformation';
si.dockerContainers(true).then(data => {
    console.log("FIRST CONTAINER:", JSON.stringify(data[0] || {}, null, 2));
}).catch(console.error);
