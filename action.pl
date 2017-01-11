#!/bin/env perl

use Image::Magick;

foreach $img ( @ARGV ) {
  my $out = Image::Magick->new;
  $x = $out->Set(size => '296x316');
  warn "$x" if "$x";
  $x = $out->ReadImage("xc:white");
  warn "$x" if "$x";

  my $top = Image::Magick->new;
  $x = $top->read($img);
  warn "$x" if "$x";
  $x = $top->Crop(width => 296, height => 247, x => 0, y => 0);
  warn "$x" if "$x";

  my $bottom = Image::Magick->new;
  $x = $bottom->read($img);
  warn "$x" if "$x";
  $x = $bottom->Crop(width => 296, height => 69, x => 0, y => 404);
  warn "$x" if "$x";

  $x = $out->Composite(image => $top, compose => 'over');
  warn "$x" if "$x";
  $x = $out->Composite(image => $bottom, compose => 'over', x => 0, y => 247);
  warn "$x" if "$x";
  $x = $out->Scale(width => 118, height => 126);
  warn "$x" if "$x";
  $x = $out->Set(quality => 100);
  warn "$x" if "$x";
  $x = $out->Write("jpg:tn_$img");
  warn "$x" if "$x";
}

