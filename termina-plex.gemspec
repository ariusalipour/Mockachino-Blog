# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name     = "termina-plex"
  spec.version  = "1.0.7"
  spec.authors  = ["Linh Pham"]
  spec.email    = ["hello@linh.social"]

  spec.summary  = "Jekyll theme based on Minima with inspirations from the Hugo theme Nightfall."
  spec.homepage = "https://github.com/questionlp/termina-plex"
  spec.license  = "MIT"

  spec.metadata["plugin_type"] = "theme"

  spec.files = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r!^(assets|_(includes|layouts|sass)/|(LICENSE|README)((\.(txt|md|markdown)|$)))!i)
  end

  spec.required_ruby_version = '>= 3.0'
  spec.add_runtime_dependency "jekyll", ">= 3.5", "< 5.0"
  spec.add_runtime_dependency "jekyll-feed", "~> 0.9"
  spec.add_runtime_dependency "jekyll-seo-tag", "~> 2.1"
  spec.add_runtime_dependency "jekyll-paginate", "~> 1.1", "< 2.0"

  spec.add_development_dependency "bundler", "~> 2.0"
end
