# Encoding: UTF-8

lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'poefy_online/version.rb'

Gem::Specification.new do |s|
  s.name          = 'poefy_online'
  s.authors       = ['Paul Thompson']
  s.email         = ['nossidge@gmail.com']

  s.summary       = 'Online rhyming poetry generator'
  s.description   = 'A web interface for the poefy gem.'
  s.homepage      = 'https://github.com/nossidge/poefy_online'

  s.version       = PoefyOnline.version_number
  s.date          = PoefyOnline.version_date
  s.license       = 'GPL-3.0'

  s.files         = `git ls-files`.split("\n")
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ['lib']

  s.add_runtime_dependency('poefy',    '~> 1.0', '>= 1.0.0')
  s.add_runtime_dependency('poefy-pg', '~> 0.1', '>= 0.1.0')
  s.add_runtime_dependency('sinatra',  '~> 2.0', '>= 2.0.0')

  s.add_development_dependency('bundler', '~> 1.13')
  s.add_development_dependency('rake',    '~> 10.0')
  s.add_development_dependency('rspec',   '~> 3.0')
end
