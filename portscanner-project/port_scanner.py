import socket
from common_ports import ports_and_services

def get_open_ports(target, port_range, verbose=False):
    if is_invalid_ip(target):
        return "Error: Invalid IP address"
    
    try:
        try:
            ip_address = socket.gethostbyname(target)
        except socket.gaierror:
            return "Error: Invalid hostname"
        
        try:
            hostname = socket.gethostbyaddr(ip_address)[0]
        except socket.herror:
            hostname = ip_address
        
        open_ports = []
        start_port, end_port = port_range
        
        for port in range(start_port, end_port + 1):
            if check_port(ip_address, port):
                open_ports.append(port)
        
        if verbose:
            return format_verbose_output(hostname, ip_address, open_ports)
        else:
            return open_ports
            
    except Exception as e:
        return "Error: Invalid hostname"

def check_port(ip, port):
    """Check if a specific port is open"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(5)  
            result = sock.connect_ex((ip, port))
            return result == 0
    except:
        return False

def is_invalid_ip(ip):
    """Check if IP address is invalid"""
    try:
        parts = ip.split('.')
        if len(parts) != 4:
            return False
            
        for part in parts:
            if not part.isdigit():
                return False
            num = int(part)
            if num < 0 or num > 255:
                return True
        
        socket.inet_aton(ip)
        return False
    except:
        if any(c.isdigit() for c in ip) and '.' in ip:
            return True
        return False

def format_verbose_output(hostname, ip, ports):
    if hostname == ip:
        output = f"Open ports for {ip}\n"
    else:
        output = f"Open ports for {hostname} ({ip})\n"
    
    output += "PORT     SERVICE\n"
    for port in ports:
        service = ports_and_services.get(port, "unknown")
        output += f"{port:<8} {service}\n"
    
    return output.rstrip()