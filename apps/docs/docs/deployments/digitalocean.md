---
sidebar_position: 1
---

# Deployment on DigitalOcean

## Terraform project

### main.tf

To provision virtual machines on DigitalOcean, you can use Terraform. Terraform is an open-source infrastructure as code software tool that provides a consistent CLI workflow to manage hundreds of cloud services. Terraform codifies cloud APIs into declarative configuration files.

```hcl title="main.tf"
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

// create ssh key
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "digitalocean_ssh_key" "default" {
  name       = "Terraform Example"
  public_key = tls_private_key.ssh_key.public_key_openssh
}
# Write private key to file
resource "local_file" "private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/id_rsa"
  file_permission = "0600"
}

# Write public key to file
resource "local_file" "public_key" {
  content         = tls_private_key.ssh_key.public_key_openssh
  filename        = "${path.module}/id_rsa.pub"
  file_permission = "0644"
}

resource "digitalocean_droplet" "web" {
  count    = length(var.regions)
  image    = "ubuntu-24-04-x64"
  name     = "hlf-${var.vm_names[count.index]}"
  region   = var.regions[count.index]
  size     = "s-1vcpu-1gb" # $6/month
  ssh_keys = [digitalocean_ssh_key.default.fingerprint]

}
resource "null_resource" "install_fabriclaunch" {
  count      = length(var.regions)
  depends_on = [digitalocean_droplet.web]
  provisioner "remote-exec" {
    inline = [
      "wget https://fabriclaunch.com/fabriclaunch && chmod +x fabriclaunch && mv fabriclaunch /usr/local/bin/fabriclaunch",
    ]
    connection {
      type        = "ssh"
      user        = "root"
      private_key = tls_private_key.ssh_key.private_key_pem
      host        = digitalocean_droplet.web[count.index].ipv4_address
    }
  }
  triggers = {
    always_run = "${timestamp()}"
  }
}

resource "null_resource" "install_go" {
  count      = length(var.regions)
  depends_on = [digitalocean_droplet.web]
  provisioner "remote-exec" {
    inline = [
      "wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz",
      "tar -C /usr/local -xzf go*.tar.gz",
      "echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc",
    ]
    connection {
      type        = "ssh"
      user        = "root"
      private_key = tls_private_key.ssh_key.private_key_pem
      host        = digitalocean_droplet.web[count.index].ipv4_address
    }
  }
}

# Null resource for remote-exec, one for each droplet
resource "null_resource" "fabric_setup" {
  count = length(var.regions)

  # Ensure this runs after the droplet is created
  depends_on = [digitalocean_droplet.web]

  # Use remote-exec provisioner to run the script
  provisioner "remote-exec" {
    inline = [
      "curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh",
      "./install-fabric.sh --fabric-version 2.5.9 binary",
      "sudo mv bin/configtxgen /usr/local/bin/configtxgen",
      "sudo mv bin/configtxlator /usr/local/bin/configtxlator",
      "sudo mv bin/cryptogen /usr/local/bin/cryptogen",
      "sudo mv bin/discover /usr/local/bin/discover",
      "sudo mv bin/fabric-ca-client /usr/local/bin/fabric-ca-client",
      "sudo mv bin/fabric-ca-server /usr/local/bin/fabric-ca-server",
      "sudo mv bin/ledgerutil /usr/local/bin/ledgerutil",
      "sudo mv bin/orderer /usr/local/bin/orderer",
      "sudo mv bin/osnadmin /usr/local/bin/osnadmin",
      "sudo mv bin/peer /usr/local/bin/peer",
      "sudo wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl",
      "sudo wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson",
      "sudo chmod +x /usr/local/bin/cfssl",
      "sudo chmod +x /usr/local/bin/cfssljson"
    ]
  }

  # Connection details for the remote-exec provisioner
  connection {
    type        = "ssh"
    user        = "root"
    private_key = tls_private_key.ssh_key.private_key_pem
    host        = digitalocean_droplet.web[count.index].ipv4_address
  }

  # Trigger recreation of this resource when the droplet changes
  triggers = {
    droplet_id = digitalocean_droplet.web[count.index].id
  }
}

output "droplet_ips" {
  value = {
    for droplet in digitalocean_droplet.web :
    droplet.name => droplet.ipv4_address
  }
}

```
### variables.tf

Then, you need to declare the variables in a `variables.tf` file:

```hcl title="variables.tf"
variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "regions" {
  description = "List of regions for droplet deployment"
  type        = list(string)
  default     = ["nyc1", "fra1", "blr1"]
}
variable "vm_names" {
  description = "List of VM names"
  type        = list(string)
}
```

To avoid hardcoding the DigitalOcean API token in the `terraform.tfvars` file, you can use the `TF_VAR_do_token` environment variable:

```bash
export TF_VAR_do_token="your_digitalocean_api_token"
```

Finally, you can create a `terraform.tfvars` file to specify the values for the variables:

```hcl title="terraform.tfvars"
regions = ["nyc1", "fra1", "blr1"]

vm_names = ["org1", "org2", "org3"]
```

## Execute Terraform

To execute the Terraform project, you can run the following commands:

```bash
terraform init
terraform apply
```

Then, you can access the virtual machines using the private key file `id_rsa`:

```bash
ssh -i id_rsa root@<droplet_ip>
```

Each of the virtual machines will have the FabricLaunch CLI installed. You can use the FabricLaunch CLI to create nodes and networks on the virtual machines.


You can see the [`Getting started`](../getting-started.md) guide to learn how to deploy the FabricLaunch CLI. The IPs is the only thing that changes, apart from not using the 'localho.st' domain, in this case, you need to use the ip as the domain.