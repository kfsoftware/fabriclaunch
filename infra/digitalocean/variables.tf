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
