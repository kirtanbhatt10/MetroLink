export function parseCsv(input:string):Record<string,string>[] {
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
 if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}if(!rows.length)return [];
 const headers=rows.shift()!.map(x=>x.trim());return rows.filter(r=>r.some(x=>x!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}
