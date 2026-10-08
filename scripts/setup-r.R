# Keep rendering dependencies local and out of the deployment payload.
library_path <- ".R-library"
dir.create(library_path, recursive=TRUE, showWarnings=FALSE)
library_path <- normalizePath(library_path, mustWork=TRUE)
.libPaths(c(library_path, .libPaths()))
repositories <- getOption("repos")
if (is.null(repositories) || !length(repositories) || any(repositories == "@CRAN@")) {
  repositories <- c(CRAN="https://cloud.r-project.org")
}
required <- c("knitr", "rmarkdown", "jsonlite", "remotes")
missing <- required[!vapply(required, requireNamespace, logical(1), quietly=TRUE)]
if (length(missing)) install.packages(missing, lib=library_path, repos=repositories)
installed_version <- tryCatch(as.character(packageVersion("mctq")), error=function(e) "")
if (installed_version != "0.3.2") {
  remotes::install_version("mctq", version="0.3.2", lib=library_path,
                           repos=repositories, upgrade="never", dependencies=NA)
}
stopifnot(all(vapply(c(required, "mctq"), requireNamespace, logical(1), quietly=TRUE)),
          as.character(packageVersion("mctq")) == "0.3.2")
cat("Rendering dependencies ready; mctq pinned to 0.3.2.\n")
